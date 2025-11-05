import Schedule from '../models/Schedule.js';
import Class from '../models/Class.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/email.js';

const EventService = {
  /**
   * עדכון מערכת השעות לפי סוג האירוע
   */
  applyEventImpact: async (event) => {
  const { type, date, classes } = event;

  // מציאת ה-schedules של כל הכיתות הרלוונטיות
  const schedules = await Schedule.find({ classId: { $in: classes } });

  const dayOfWeekMap = ['sunday','monday','tuesday','wednesday','thursday','friday'];
  const eventDay = dayOfWeekMap[new Date(date).getDay()];

  for (let schedule of schedules) {
    let lessons = schedule.weekPlan[eventDay];
    
    if (!lessons || !Array.isArray(lessons)) {
      continue; // דלג על מערכת שעות שלא מוגדרת ליום זה
    }

    lessons.forEach(lesson => {
      const lessonStart = parseTime(lesson.startTime);
      const lessonEnd = parseTime(lesson.endTime);
      const eventStart = parseTime(event.startTime);
      const eventEnd = parseTime(event.endTime);

      const overlaps = lessonEnd > eventStart && lessonStart < eventEnd;

      if (overlaps) {
        // שיעור חופף לאירוע → עדכון סטטוס/נוט/קישור לאירוע
        if (type === 'trip') {
          lesson.status = 'cancelled';
          lesson.note = 'טיול';
        } else if (type === 'activity') {
          lesson.status = 'cancelled';
          lesson.note = 'פעילות בית ספרית';
        } else if (type === 'exam') {
          lesson.status = 'normal';
          lesson.note = 'מבחן';
        }
        lesson.event = event._id;
      } else {
        // שיעור לא חופף אך היה קשור לאירוע הזה → החזרת סטטוס למצב רגיל
        if (lesson.event?.toString() === event._id.toString()) {
          lesson.status = 'normal';
          lesson.note = '';
          lesson.event = null;
        }
      }
    });

    await schedule.save();
  }
},

  /**
   * שליחת התראות למורים ולתלמידים על השיעורים הרלוונטיים
   */
  sendNotifications: async (event) => {
    const { type, date, classes } = event;

    const schedules = await Schedule.find({ classId: { $in: classes } });

    for (let schedule of schedules) {
      const dayOfWeekMap = ['sunday','monday','tuesday','wednesday','thursday','friday'];
      const eventDay = dayOfWeekMap[new Date(date).getDay()];
      const lessons = schedule.weekPlan[eventDay];

      for (let lesson of lessons) {
        const lessonStart = parseTime(lesson.startTime);
        const lessonEnd = parseTime(lesson.endTime);
        const eventStart = parseTime(event.startTime);
        const eventEnd = parseTime(event.endTime);

        if (lessonEnd <= eventStart || lessonStart >= eventEnd) continue;

        const teacher = await User.findById(lesson.teacherId);
        if (teacher) {
          await sendEmail(
            {
              to: teacher.email,
              subject: `אירוע חדש: ${type} בתאריך ${date.toDateString()}`,
              html: `שלום ${teacher.name},<br>יש לך שינוי בשיעור: ${lesson.subject} בתאריך ${date.toDateString()}.<br>סוג האירוע: ${type}`
            });
        }

        const classDoc = await Class.findById(schedule.classId);
        if (classDoc && classDoc.students) {
          const students = await User.find({ _id: { $in: classDoc.students } });
          for (let student of students) {
            await sendEmail(
              {
                to: student.email,
                subject: `אירוע חדש בכיתה שלך: ${type} בתאריך ${date.toDateString()}`,
                html: `שלום ${student.name},<br>יש שינוי בשיעור: ${lesson.subject} בתאריך ${date.toDateString()}.<br>סוג האירוע: ${type}`
              });
          }
        }
      }
    }
  },
  
  revertEventImpact: async (event) => {
  const { classes, date, startTime, endTime } = event;

  const schedules = await Schedule.find({
    classId: { $in: classes }
  });

  const dayOfWeekMap = ['sunday','monday','tuesday','wednesday','thursday','friday'];
  const eventDay = dayOfWeekMap[new Date(date).getDay()];

  for (let schedule of schedules) {
    let lessons = schedule.weekPlan[eventDay];
    
    if (!lessons || !Array.isArray(lessons)) {
      continue; // דלג על מערכת שעות שלא מוגדרת ליום זה
    }

    lessons.forEach(lesson => {
      const lessonStart = parseTime(lesson.startTime);
      const lessonEnd = parseTime(lesson.endTime);
      const eventStart = parseTime(startTime);
      const eventEnd = parseTime(endTime);

      if (lessonEnd <= eventStart || lessonStart >= eventEnd) return;

      // החזרת הסטטוס למצב רגיל
      lesson.status = 'normal';
      lesson.note = '';
    });

    await schedule.save();
  }
}
};

// פונקציה עזר להמרת "HH:MM" למספר דקות מהחצות
function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export default EventService;
