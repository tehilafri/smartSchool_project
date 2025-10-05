import Schedule from '../models/Schedule.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import School from '../models/School.js';
import ExternalSubstitute from '../models/ExternalSubstitute.js';
import SubstituteRequest from '../models/SubstituteRequest.js';
import { generateCode } from '../utils/generatedCode.js';
import { getDayName, isTimeOverlap } from '../utils/dateUtils.js';
import { sendEmail } from '../utils/email.js';

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

  for (const extSub of externalCandidatesRaw) {
    // שולף את כל לוחות השיעורים של אותו יום
    const schedules = await Schedule.find({
      [`weekPlan.${date.toLocaleString('en-US', { weekday: 'long' }).toLowerCase()}.substitute`]: extSub._id
    });

    // אם לא מצאנו שיעור שהם כבר מחליפים באותו יום – פנוי
    if (schedules.length === 0) {
      availableExternal.push(extSub);
    }
  }


  return { availableInternal, availableExternal };
};

/**
 * לוגיקה עסקית של דיווח היעדרות
 */
export async function handleTeacherAbsences({ teacherId, date, startTime, endTime, reason }) {
  const teacher = await User.findById(teacherId);
  if (!teacher) throw new Error('Teacher not found');

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
        const appBase = process.env.APP_BASE_URL || "http://localhost:1000"; // חובה לשים URL ציבורי אם רוצים לגשת חיצונית (ngrok/heroku וכו')
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

  try{
  // שליחת מייל למי שאישר
  const approver = await User.findById(approverId);
  if (approver?.email) {
    await sendEmail(
      approver.email,
      'Replacement Approved',
      `Hi ${approver.firstName} ${approver.lastName},

The replacement request code: **${absenceCode}** was successfully approved.

Substitute: ${absence.response.firstName} ${absence.response.lastName}
Notes: ${absence.response.notes}

To view details, enter the absence code on the website under Absences -> Absence Confirmation Details.

Have a great day!
smartSchool Team`
    );
  }
  } catch (err) {
  console.error("Email sending failed, but replacement was saved:", err);
}

  return { message: 'Replacement approved', absence };
}