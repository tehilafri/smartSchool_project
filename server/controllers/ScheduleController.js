import Schedule from '../models/Schedule.js';
import Class from '../models/Class.js';
import User from '../models/User.js';

const addSubjectToTeacher = async (teacherId, subject) => {
  const teacher = await User.findById(teacherId);
  if (!teacher) throw new Error("מורה לא נמצאה");

  if (!teacher.subjects.includes(subject)) {
    teacher.subjects.push(subject);
    await teacher.save();
  }
};

export const createSchedule = async (req, res) => {
  try {
    const { className, weekPlan } = req.body;

    // חיפוש הכיתה
    const classDoc = await Class.findOne({ name: className });
    if (!classDoc) return res.status(404).json({ error: "כיתה לא נמצאה" });

    // בדיקה אם המשתמש מורה – מורה יכול להוסיף רק בכיתה שהוא מחנך שלה
    if (req.role === 'teacher') {
      if (!classDoc.homeroomTeacher.equals(req.id)) {
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
           // הוספה לסל ידע
          await addSubjectToTeacher(teacher._id, lesson.subject);
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

    // הוספת הכיתה לכל המורים שמופיעים בשיעורים
    const teachers = new Set(); // למנוע כפילויות
    for (const day of Object.keys(weekPlanWithDefaults)) {
      for (const lesson of weekPlanWithDefaults[day]) {
        teachers.add(lesson.teacherId.toString());
      }
    }

    for (const teacherId of teachers) {
      const teacher = await User.findById(teacherId);
      if (!teacher.classes.includes(classDoc._id)) {
        teacher.classes.push(classDoc._id);
        await teacher.save();
      }
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

    // בדיקה אם המשתמש מורה – מורה יכול להוסיף רק בכיתה שהוא מחנך שלה
    if (req.role === 'teacher') {
      if (!classDoc.homeroomTeacher.equals(req.id)) {
        return res.status(403).json({ error: "מורה יכול להוסיף או לעדכן מערכת רק בכיתה שהוא מחנך שלה" });
      }
    }

    // המרת ת"ז של המורים ל-ObjectId
    const lessonsWithIds = await Promise.all(
      lessons.map(async (lesson) => {
        const teacher = await User.findOne({ userId: lesson.teacherId });
        if (!teacher) throw new Error(`מורה עם ת"ז ${lesson.teacherId} לא נמצא`);
        // הוספה לסל ידע
        await addSubjectToTeacher(teacher._id, lesson.subject);
        return { ...lesson, teacherId: teacher._id };
      })
    );

    // עדכון רק יום אחד
    const schedule = await Schedule.findOneAndUpdate(
      { classId: classDoc._id },
      { $set: { [`weekPlan.${day}`]: lessonsWithIds } },
      { new: true, upsert: true }
    );

    // הוספת הכיתה לכל המורים שמופיעים ביום הזה
    const teachers = new Set(lessonsWithIds.map(l => l.teacherId.toString()));

    for (const teacherId of teachers) {
      const teacher = await User.findById(teacherId);
      if (!teacher.classes.includes(classDoc._id)) {
        teacher.classes.push(classDoc._id);
        await teacher.save();
      }
    }
    
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

    // למצוא את הכיתה שלו (לפי classes שהן ObjectId)
    const classDoc = await Class.findOne({ _id: { $in: user.classes } });
    if (!classDoc) return res.status(404).json({ error: "סטודנט לא נמצא בכיתה" });

    const schedule = await Schedule.findOne({ classId: classDoc._id });
    if (!schedule) return res.status(404).json({ error: "מערכת השיעורים לא קיימת" });

    const now = new Date();
    const daysOfWeek = ['sunday','monday','tuesday','wednesday','thursday','friday'];
    const todayDay = daysOfWeek[now.getDay()]; // היום בשבוע

    const lessons = schedule.weekPlan[todayDay] || [];
    let nextLesson = null;

    for (const lesson of lessons) {
      const [hour, minute] = lesson.startTime.split(':').map(Number);
      const lessonDate = new Date();
      lessonDate.setHours(hour, minute, 0, 0);

      if (lessonDate >= now) {
        nextLesson = {
          day: todayDay,
          subject: lesson.subject,
          startTime: lesson.startTime,
          endTime: lesson.endTime,
          teacherId: lesson.teacherId,
          status: lesson.status,
          substitute: lesson.substitute || null
        };
        break;
      }
    }

    res.json({ nextLesson }); // אם אין שיעורים היום – nextLesson יהיה null
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getNextLessonForTeacher = async (req, res) => {
  try {
    const teacherId = req.id; // מזהה המורה
    const teacher = await User.findById(teacherId);
    if (!teacher) return res.status(404).json({ error: "מורה לא נמצא" });

    const classes = teacher.classes; // מערך ObjectId
    if (!classes || classes.length === 0)
      return res.status(404).json({ error: "המורה לא מלמד בכיתות כלשהן" });

    const schedules = await Schedule.find({ classId: { $in: classes } });
    if (!schedules || schedules.length === 0)
      return res.status(404).json({ error: "לא נמצאו מערכות שיעורים" });

    const now = new Date();
    const daysOfWeek = ['sunday','monday','tuesday','wednesday','thursday','friday'];
    const todayDay = daysOfWeek[now.getDay()]; // היום בשבוע

    let nextLesson = null;

    outerLoop:
    for (const schedule of schedules) {
      const lessons = schedule.weekPlan[todayDay] || [];
      for (const lesson of lessons) {
        if (!lesson.teacherId.equals(teacher._id)) continue;

        const [hour, minute] = lesson.startTime.split(':').map(Number);
        const lessonDate = new Date();
        lessonDate.setHours(hour, minute, 0, 0);

        if (lessonDate >= now) {
          nextLesson = {
            classId: schedule.classId,
            day: todayDay,
            subject: lesson.subject,
            startTime: lesson.startTime,
            endTime: lesson.endTime,
            status: lesson.status,
            substitute: lesson.substitute || null
          };
          break outerLoop;
        }
      }
    }

    res.json({ nextLesson }); // אם אין שיעורים היום – nextLesson יהיה null
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getScheduleByTeacher = async (req, res) => {
  try {
    const teacherId = req.id;

    if (!teacherId) {
      return res.status(400).json({ error: "Teacher ID not provided" });
    }

    // שליפה של כל ה-schedules שבהם המורה מופיע
    const schedules = await Schedule.find({
      $or: [
        { "weekPlan.sunday.teacherId": teacherId },
        { "weekPlan.monday.teacherId": teacherId },
        { "weekPlan.tuesday.teacherId": teacherId },
        { "weekPlan.wednesday.teacherId": teacherId },
        { "weekPlan.thursday.teacherId": teacherId },
        { "weekPlan.friday.teacherId": teacherId }
      ]
    }).lean();

    // יצירת מבנה ייחודי של ימים ושיעורים
    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];

    const result = daysOfWeek.map(day => ({
      day,
      lessons: []
    }));

    // מילוי המערך
    for (const schedule of schedules) {
      for (const day of daysOfWeek) {
        const lessons = schedule.weekPlan[day] || [];
        const teacherLessons = lessons
          .filter(lesson => lesson.teacherId.toString() === teacherId.toString())
          .map(lesson => ({
            classId: schedule.classId,
            subject: lesson.subject,
            startTime: lesson.startTime,
            endTime: lesson.endTime,
            status: lesson.status,
            substitute: lesson.substitute
          }));

        // מוסיפים את השיעורים לאותו יום
        const dayObj = result.find(d => d.day === day);
        dayObj.lessons.push(...teacherLessons);
      }
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
