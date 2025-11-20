import Schedule from '../models/Schedule.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import School from '../models/School.js';
import ExternalSubstitute from '../models/ExternalSubstitute.js';
import SubstituteRequest from '../models/SubstituteRequest.js';
import { generateCode } from '../utils/generatedCode.js';
import { getDayName, isTimeOverlap } from '../utils/dateUtils.js';
import { sendEmail } from '../utils/email.js';
import { readSheet } from '../utils/googleSheets.js';

/**
 * בודק אם למורה יש שיעורים חופפים בתאריך ובשעות הנתונות בכל בתי הספר
 * מחזיר true אם המורה פנויה, false אם יש חפיפה
 */
export const isTeacherFree = async (teacherId, date, startTime, endTime) => {
  const day = date.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();

  // שאילתא שמחפשת כל לוח שיעורים שמכיל שיעור של המורה ביום הזה שחופף עם השעות
  const overlappingLesson = await Schedule.findOne({
    [`weekPlan.${day}`]: {
      $elemMatch: {
        teacherId: teacherId.toString(),
        $or: [
          { 
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
          }
        ]
      }
    }
  });

  return !overlappingLesson; // אם מצאנו שיעור חופף – false, אחרת – true
};

/**
 * מוצא את המורים הפנויים להחלפה עבור בקשת החיסור
 */
export const findCandidates = async (substituteRequest) => {
  const { date, startTime, endTime } = substituteRequest;

  // --- פנימיים ---
  const internalCandidates = await User.find({
    role: 'teacher',
    schoolId: substituteRequest.schoolId,
    _id: { $ne: substituteRequest.originalTeacherId }
  });

  const availableInternal = [];

  for (const teacher of internalCandidates) {
    const free = await isTeacherFree(teacher._id, date, startTime, endTime);
    if (free) {
      availableInternal.push(teacher);
    }
  }

  // --- חיצוניים ---
  const externalCandidatesRaw = await ExternalSubstitute.find({
    schoolId: substituteRequest.schoolId
  });

  // סינון חיצוניים שכבר מחליפים שיעור אחר באותו יום ושעה
  const availableExternal = [];
  const day = date.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();

  for (const extSub of externalCandidatesRaw) {
    // בדיקה אם המורה החיצוני פנוי בשעות הספציפיות
    const overlappingLesson = await Schedule.findOne({
      [`weekPlan.${day}`]: {
        $elemMatch: {
          substitute: extSub._id,
          $or: [
            { 
              startTime: { $lt: endTime },
              endTime: { $gt: startTime }
            }
          ]
        }
      }
    });

    // אם לא מצאנו שיעור חופף – המורה פנוי
    if (!overlappingLesson) {
      availableExternal.push(extSub);
    }
  }


  return { availableInternal, availableExternal };
};

async function notifyOtherCandidates(absenceCode, approvedEmail) {
  try {
    // שליפת פרטי הבקשה
    const request = await SubstituteRequest.findOne({ absenceCode })
      .populate('originalTeacherId')
      .populate('schoolId')
      .populate('classId');
    
    if (!request) return;
    
    const SHEET_ID = process.env.SHEET_ID;
    const SHEET_TAB = process.env.SHEET_TAB_NAME || "Responses";
    const SHEET_RANGE = `'${SHEET_TAB}'!A:Z`;
    
    const rows = await readSheet(SHEET_ID, SHEET_RANGE);
    if (!rows || rows.length < 2) return;
    
    const formattedDate = new Date(request.date).toLocaleDateString('he-IL');
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowAbsenceCode = row[5]?.toString().trim();
      const rowEmail = row[1];
      
      if (rowAbsenceCode === absenceCode && rowEmail && rowEmail !== approvedEmail) {
        await sendEmail({
          to: rowEmail,
          subject: 'תודה על הרצון הטוב',
          html: `
            <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
              <h3>תודה על הרצון הטוב</h3>
              <p>תודה על הרצון הטוב, אך כבר הסתדרנו עם ממלא/ת מקום אחר/ת.</p>
              
              <h4>פרטי הבקשה שרצית למלא:</h4>
              <ul>
                <li><strong>מזהה בקשה:</strong> ${absenceCode}</li>
                <li><strong>תאריך:</strong> ${formattedDate}</li>
                <li><strong>שעות:</strong> ${request.startTime} - ${request.endTime}</li>
                <li><strong>מקצוע:</strong> ${request.subject}</li>
                <li><strong>כיתה:</strong> ${request.classId?.name || 'לא ידוע'}</li>
                <li><strong>בית ספר:</strong> ${request.schoolId?.name || 'לא ידוע'}</li>
                <li><strong>כתובת בית ספר:</strong> ${request.schoolId?.address || 'לא ידוע'}</li>
              </ul>
              
              <p>בהצלחה,<br>המערכת</p>
            </div>
          `
        });
      }
    }
  } catch (error) {
    console.error('Error notifying other candidates:', error);
  }
}

// פונקציה לשליחת מייל אישור לממלאת המקום שנבחרה
async function notifySelectedSubstitute(request) {
  try {
    // שליפת פרטים מלאים
    const fullRequest = await SubstituteRequest.findById(request._id)
      .populate('schoolId')
      .populate('classId');
    
    const formattedDate = new Date(fullRequest.date).toLocaleDateString('he-IL');
    
    await sendEmail({
      to: fullRequest.response.email,
      subject: 'מזל טוב! נבחרת למלא מקום',
      html: `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
          <h2>מזל טוב! נבחרת למלא מקום</h2>
          
          <p>שלום ${fullRequest.response.firstName},</p>
          <p>אנחנו שמחים לבשר שנבחרת למלא מקום!</p>
          
          <h3>פרטי השיעור:</h3>
          <ul>
            <li><strong>מזהה בקשה:</strong> ${fullRequest.absenceCode}</li>
            <li><strong>תאריך:</strong> ${formattedDate}</li>
            <li><strong>שעות:</strong> ${fullRequest.startTime} - ${fullRequest.endTime}</li>
            <li><strong>מקצוע:</strong> ${fullRequest.subject}</li>
            <li><strong>כיתה:</strong> ${fullRequest.classId?.name || 'לא ידוע'}</li>
            <li><strong>בית ספר:</strong> ${fullRequest.schoolId?.name || 'לא ידוע'}</li>
            <li><strong>כתובת:</strong> ${fullRequest.schoolId?.address || 'לא ידוע'}</li>
          </ul>
          
          <p><strong>אנא הגיעי בזמן.</strong></p>
          
          <p>תודה על הנכונות לעזור!<br>
          המערכת, smartSchool</p>
        </div>
      `
    });
  } catch (error) {
    console.error('Error notifying selected substitute:', error);
  }
}

/**
 * לוגיקה עסקית של דיווח היעדרות
 */
export async function handleTeacherAbsences({ teacherId, date, startTime, endTime, reason }) {
  const teacher = await User.findById(teacherId);
  if (!teacher) throw new Error('Teacher not found');

  // בדיקה למניעת כפילויות - בדיקה אם כבר יש בקשה באותו יום ושעות
  const existingRequest = await SubstituteRequest.findOne({
    originalTeacherId: teacherId,
    date: new Date(date),
    $or: [
      {
        startTime: { $lte: startTime },
        endTime: { $gt: startTime }
      },
      {
        startTime: { $lt: endTime },
        endTime: { $gte: endTime }
      },
      {
        startTime: { $gte: startTime },
        endTime: { $lte: endTime }
      }
    ]
  });

  if (existingRequest) {
    const formattedDate = new Date(date).toLocaleDateString('he-IL');
    throw new Error(`כבר יש לך בקשת היעדרות בתאריך ${formattedDate} בשעות ${existingRequest.startTime}-${existingRequest.endTime}. לא ניתן לדווח על אותו זמן שוב.`);
  }

  // מוצאים את כל הכיתות שהמורה מלמדת
  const teacherClasses = await Class.find({ schoolId: teacher.schoolId, teachers: teacher._id });

  if (!teacherClasses.length) throw new Error('No classes found for this teacher');

  const toMinutes = t => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);

  const absenceCodes = [];

  for (const schoolClass of teacherClasses) {
    const schedule = await Schedule.findOne({ classId: schoolClass._id, schoolId: teacher.schoolId });
    if (!schedule) continue;

    const dayName = getDayName(date);
    const lessons = schedule.weekPlan[dayName] || [];

    for (const lesson of lessons) {
      const lessonStart = toMinutes(lesson.startTime);
      const lessonEnd = toMinutes(lesson.endTime);

      if (lessonEnd > startMinutes && lessonStart < endMinutes) {
        // בדיקה אם השיעור שייך למורה
        if (!lesson.teacherId) continue; // שיעורים ריקים
        if (lesson.teacherId.toString() !== teacher._id.toString()) continue;

        const absenceCode = generateCode();

        const absence = new SubstituteRequest({
          originalTeacherId: teacher._id,
          schoolId: schoolClass.schoolId,
          date,
          startTime: lesson.startTime,
          endTime: lesson.endTime,
          subject: lesson.subject,
          classId: schoolClass._id,
          reason,
          status: 'pending',
          absenceCode
        });

        // --- כאן יוצרים את הקישור ל-Google Form ---
        const appBase = process.env.VITE_API_URL || "http://localhost:3000"; // חובה לשים URL ציבורי אם רוצים לגשת חיצונית (ngrok/heroku וכו')
        const formBaseUrl = `${appBase}/form`; // ראוט חדש בשרת שמטפל בבדיקה/הפניה
        const formLink = `${formBaseUrl}?absenceCode=${encodeURIComponent(absenceCode)}`;
        absence.formLink = formLink;
        console.log('Form Link:', formLink);
        await absence.save();
        absenceCodes.push(absenceCode);
      }
    }
  }

  if (absenceCodes.length === 0) throw new Error('You are not assigned to any lessons in this time range');

  return absenceCodes;
}

/**
 * אישור בקשת היעדרות והוספת ממלא מקום
 */
export async function handleApproveReplacement({ absenceCode, approverId, firstName, lastName, email, notes, identityNumber ,phone}, schoolId) {
  // חיפוש בקשת ההיעדרות
  const absence = await SubstituteRequest.findOne({ absenceCode});
  if (!absence) throw new Error('Absence not found');

  if (absence.schoolId.toString() !== schoolId.toString()) {
    throw new Error('Access denied: wrong school');
  }

  // רק מי שיצר את הבקשה יכול לאשר
  if (absence.originalTeacherId.toString() !== approverId) {
    throw new Error('You are not allowed to approve this request');
  }

  if (absence.status === 'accepted') {
    return { message: 'Replacement already approved', absence };
  }

  // זיהוי אם מדובר במורה פנימי או חיצוני
  let substitute = await User.findOne({ userId: identityNumber });
  let substituteType = 'User';

  if (!substitute) {
    substitute = await ExternalSubstitute.findOne({ identityNumber });
    substituteType = 'ExternalSubstitute';
  }

  if (!substitute) throw new Error('Substitute with this identity number not found');


  // עדכון מערכת השעות
  const schedule = await Schedule.findOne({ classId: absence.classId });
  if (schedule) {
    const dayName = getDayName(absence.date);
    const lessons = schedule.weekPlan[dayName] || [];

    const lesson = lessons.find(l =>
      l.teacherId && l.teacherId.toString() === absence.originalTeacherId.toString() &&
      l.subject === absence.subject &&
      l.startTime === absence.startTime &&
      l.endTime === absence.endTime
    );

    if (lesson) {
      lesson.substitute = substitute._id;
      lesson.substituteModel = substituteType;
      lesson.status = 'replaced';
      lesson.replacementDate = absence.date;
      await schedule.save();
    }
  }

  // עדכון פרטי הבקשה - רק אחרי שראינו שאכן יש כזה שיעור במערכת השעות - מותר לאשר את הבקשה
  absence.substituteTeacher = substitute._id;
  absence.substituteModel = substituteType;
  absence.status = 'accepted';
  absence.response = { firstName, lastName, identityNumber, email, notes };
  await absence.save();
  const request=await absence.populate('originalTeacherId');
  await notifySelectedSubstitute(request);
  await notifyOtherCandidates(absenceCode, request.response.email)

  return { message: 'Replacement approved', absence };
}