import Schedule from '../models/Schedule.js';
import Class from '../models/Class.js';
import User from '../models/User.js';

export const createSchedule = async (req, res) => {
  try {
    const { className, weekPlan } = req.body;

    // חיפוש הכיתה
    const classDoc = await Class.findOne({ name: className });
    if (!classDoc) return res.status(404).json({ error: "כיתה לא נמצאה" });

    // בדיקה אם יש הרשאה להוסיף מערכת
    if (!['teacher', 'admin'].includes(req.role)) {
      return res.status(403).json({ error: "אין הרשאה להוסיף מערכת" });
    }

    // בדיקה אם המשתמש מורה – מורה יכול להוסיף רק בכיתה שהוא מחנך שלה
    if (req.role === 'teacher') {
      const teacher = await User.findById(req.id);
      if (classDoc.homeroomTeacher !== teacher.userId) {
        return res.status(403).json({ error: "מורה יכול להוסיף או לעדכן מערכת רק בכיתה שהוא מחנך שלה" });
      }
    }

    // הגדרת weekPlan עם כל הימים כברירת מחדל
    const defaultWeekPlan = {
      sunday: [], monday: [], tuesday: [], wednesday: [],
      thursday: [], friday: []
    };
    const weekPlanWithDefaults = { ...defaultWeekPlan, ...weekPlan };

    // המרת ת"ז של המורים ל-ObjectId
    for (const day of Object.keys(weekPlanWithDefaults)) {
      weekPlanWithDefaults[day] = await Promise.all(
        weekPlanWithDefaults[day].map(async (lesson) => {
          const teacher = await User.findOne({ userId: lesson.teacherId });
          if (!teacher) throw new Error(`מורה עם ת"ז ${lesson.teacherId} לא נמצא`);
          return { ...lesson, teacherId: teacher._id };
        })
      );
    }

    // שמירת המערכת או עדכון קיימת
    const schedule = await Schedule.findOneAndUpdate(
      { classId: classDoc._id },
      { weekPlan: weekPlanWithDefaults },
      { upsert: true, new: true }
    );

    // הוספה למערך ה-schedule של הכיתה (אם עוד לא קיים)
    if (!classDoc.schedule.includes(schedule._id)) {
      classDoc.schedule.push(schedule._id);
      await classDoc.save();
    }

    res.json({ message: "מערכת נשמרה בהצלחה", schedule });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "שגיאת שרת" });
  }
};

export const updateScheduleDay = async (req, res) => {
  try {
    const { className, day, lessons } = req.body;

    // למצוא את הכיתה
    const classDoc = await Class.findOne({ name: className });
    if (!classDoc) return res.status(404).json({ error: "כיתה לא נמצאה" });

    // בדיקה אם יש הרשאה להוסיף/לעדכן
    if (!['teacher', 'admin'].includes(req.role)) {
      return res.status(403).json({ error: "אין הרשאה להוסיף או לעדכן מערכת" });
    }

    // בדיקה אם המשתמש מורה – מורה יכול להוסיף רק בכיתה שהוא מחנך שלה
    if (req.role === 'teacher') {
      const teacher = await User.findById(req.id);
      if (classDoc.homeroomTeacher !== teacher.userId) {
        return res.status(403).json({ error: "מורה יכול להוסיף או לעדכן מערכת רק בכיתה שהוא מחנך שלה" });
      }
    }

    // המרת ת"ז של המורים ל-ObjectId
    const lessonsWithIds = await Promise.all(
      lessons.map(async (lesson) => {
        const teacher = await User.findOne({ userId: lesson.teacherId });
        if (!teacher) throw new Error(`מורה עם ת"ז ${lesson.teacherId} לא נמצא`);
        return { ...lesson, teacherId: teacher._id };
      })
    );

    // עדכון רק יום אחד
    const schedule = await Schedule.findOneAndUpdate(
      { classId: classDoc._id },
      { $set: { [`weekPlan.${day}`]: lessonsWithIds } },
      { new: true, upsert: true }
    );

    res.json({ message: `המערכת ליום ${day} עודכנה בהצלחה`, schedule });

  } catch (err) {
    res.status(500).json({ error: err.message || "שגיאת שרת" });
  }
};

export const getNextLessonForStudent = async (req, res) => {
  try {
    const studentId = req.id; // מזהה סטודנט
    const user = await User.findById(studentId);
    if (!user) return res.status(404).json({ error: "סטודנט לא נמצא" });

    // למצוא את הכיתה שלו
    const classDoc = await Class.findOne({ students: user.userId });
    if (!classDoc) return res.status(404).json({ error: "סטודנט לא נמצא בכיתה" });

    const schedule = await Schedule.findOne({ classId: classDoc._id });
    if (!schedule) return res.status(404).json({ error: "מערכת השיעורים לא קיימת" });

    const now = new Date();
    let nextLesson = null;

    const daysOfWeek = ['sunday','monday','tuesday','wednesday','thursday','friday'];

    outerLoop:
    for (const day of daysOfWeek) {
      const lessons = schedule.weekPlan[day] || [];
      for (const lesson of lessons) {
        // המרה ל־Date מלאה כדי להשוות לשעה הנוכחית
        const [hour, minute] = lesson.startTime.split(':').map(Number);
        const lessonDate = new Date();
        lessonDate.setHours(hour, minute, 0, 0);

        if (lessonDate >= now) {
          nextLesson = {
            day,
            subject: lesson.subject,
            startTime: lesson.startTime,
            endTime: lesson.endTime,
            teacherId: lesson.teacherId,
            status: lesson.status,
            substitute: lesson.substitute || null
          };
          break outerLoop;
        }
      }
    }

    res.json({ nextLesson }); // אם אין שיעורים – nextLesson יהיה null
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getScheduleByTeacher = async (req, res) => {
  try {
    const teacherId = req.id; // מזהה המורה שמבצע את הבקשה

    if (!teacherId) {
      return res.status(400).json({ error: "Teacher ID not provided" });
    }

    // מוצאים את כל הסדרות שבהן מופיע המורה בכל יום
    const schedules = await Schedule.find({
      $or: [
        { "weekPlan.sunday.teacherId": teacherId },
        { "weekPlan.monday.teacherId": teacherId },
        { "weekPlan.tuesday.teacherId": teacherId },
        { "weekPlan.wednesday.teacherId": teacherId },
        { "weekPlan.thursday.teacherId": teacherId },
        { "weekPlan.friday.teacherId": teacherId }
      ]
    });

    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};