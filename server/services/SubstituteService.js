import Schedule from '../models/Schedule.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import ExternalSubstitute from '../models/ExternalSubstitute.js';
import SubstituteRequest from '../models/SubstituteRequest.js';
import { generateCode } from '../utils/generatedCode.js';
import { getDayName, isTimeOverlap } from '../utils/dateUtils.js';
import { sendEmail } from '../utils/email.js';

/**
 * מחפשת מועמדים פנימיים וחיצוניים למילוי מקום
 * @param {Object} substituteRequest - בקשת מילוי מקום
 * @returns {Object} availableInternal, availableExternal
 */
export const findCandidates = async (substituteRequest) => {
  const { date, startTime, endTime, subject } = substituteRequest;

  // --- פנימיות ---
  const internalCandidates = await User.find({
    role: 'teacher',
    _id: { $ne: substituteRequest.originalTeacherId }
  });

  const availableInternal = [];

  for (const teacher of internalCandidates) {
    const schedules = await Schedule.find({ 'classId': { $in: teacher.classes } });

    let free = true; // מניחים שהמורה פנויה

    schedules.forEach(schedule => {
      const day = date.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
      const lessons = schedule.weekPlan[day] || [];

      lessons.forEach(lesson => {
        const lessonStart = lesson.startTime; // לדוגמה: '08:30'
        const lessonEnd = lesson.endTime;     // לדוגמה: '09:00'

        // בדיקה אם יש חפיפה
        if (!(endTime <= lessonStart || startTime >= lessonEnd)) {
          free = false; // יש חפיפה – לא פנוי
        }
      });
    });

    if (free) {
      availableInternal.push(teacher);
    }
  }

  // --- חיצוניים ---
  const availableExternal = await ExternalSubstitute.find({
    availability: {
      $elemMatch: {
        $or: [
          { date: null }, // זמינות תמידית (ברירת מחדל)
          { date: date }  // זמינות ספציפית ליום
        ],
        startTime: { $lte: startTime }, // התחלת הזמינות לפני או בשעה של השיעור
        endTime: { $gte: startTime }    // סיום הזמינות אחרי או בשעה של השיעור
      }
    }
  });

  return { availableInternal, availableExternal };
};


/**
 * חיפוש שיעור תואם
 */
function findMatchingLesson(lessons, teacherId, subject, startTime, endTime) {
  return lessons.find(lesson =>
    lesson.teacherId.toString() === teacherId.toString() &&
    lesson.subject === subject &&
    isTimeOverlap(lesson.startTime, lesson.endTime, startTime, endTime)
  );
}

/**
 * לוגיקה עסקית של דיווח היעדרות
 */
export async function handleReportAbsence({ teacherId, date, startTime, endTime, subject, className, reason }) {
  const teacher = await User.findById(teacherId);
  if (!teacher) throw new Error('Teacher not found');

  const schoolClass = await Class.findOne({ name: className });
  if (!schoolClass) throw new Error('Class not found');

  const schedule = await Schedule.findOne({ classId: schoolClass._id });
  if (!schedule) throw new Error('Schedule not found');

  const dayName = getDayName(date);
  const lessons = schedule.weekPlan[dayName] || [];

  const matchingLesson = findMatchingLesson(lessons, teacher._id, subject, startTime, endTime);
  console.log('Teacher:', teacher);
  console.log('Class:', schoolClass);
  console.log('Schedule:', schedule);
  console.log('Day Name:', dayName);
  console.log('Lessons:', lessons);
  console.log('Matching Lesson:', matchingLesson);

  if (!matchingLesson) throw new Error('You are not assigned to this subject at this time in this class');

  const absenceCode = generateCode();

  const absence = new SubstituteRequest({
    originalTeacherId: teacher._id,
    date,
    startTime,
    endTime,
    subject,
    classId: schoolClass._id,
    reason,
    status: 'pending',
    absenceCode
  });

  await absence.save();
  return absenceCode;
}

/**
 * אישור בקשת היעדרות והוספת ממלא מקום
 */
export async function handleApproveReplacement({ absenceCode, approverId, firstName, lastName, email, notes, identityNumber }) {
  // חיפוש בקשת ההיעדרות
  const absence = await SubstituteRequest.findOne({ absenceCode });
  if (!absence) throw new Error('Absence not found');

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
      l.teacherId.toString() === absence.originalTeacherId.toString() &&
      l.subject === absence.subject &&
      l.startTime === absence.startTime &&
      l.endTime === absence.endTime
    );

    if (lesson) {
      lesson.substitute = substitute._id;
      lesson.substituteModel = substituteType;
      lesson.status = 'replaced';
      await schedule.save();
    }
  }

  // עדכון פרטי הבקשה - רק אחרי שראינו שאכן יש כזה שיעור במערכת השעות - מותר לאשר את הבקשה
  absence.substituteTeacher = substitute._id;
  absence.substituteModel = substituteType;
  absence.status = 'accepted';
  absence.response = { firstName, lastName, identityNumber, email, notes };
  await absence.save();

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

  return { message: 'Replacement approved', absence };
}