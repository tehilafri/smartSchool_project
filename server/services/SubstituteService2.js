import User from '../models/User.js';
import Schedule from '../models/Schedule.js';
import ExternalSubstitute from '../models/ExternalSubstitute.js';

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
