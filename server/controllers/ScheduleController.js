import Schedule from '../models/Schedule.js';
import Class from '../models/Class.js';
import User from '../models/User.js';
import School from '../models/School.js';
import { isTeacherFree } from '../services/SubstituteService.js';

const addSubjectToTeacher = async (teacherId, subject, schoolId) => {
  const teacher = await User.findOne({ _id: teacherId, schoolId });
  if (!teacher) throw new Error("מורה לא נמצאה");

  if (!teacher.subjects.includes(subject)) {
    teacher.subjects.push(subject);
    await teacher.save();
  }
};

export const createSchedule = async (req, res) => {
  try {
    const { className, weekPlan } = req.body;

    // חיפוש בית הספר
    const school = await School.findById(req.schoolId);
    if (!school) return res.status(404).json({ error: "בית ספר לא נמצא" });

    // חיפוש הכיתה
    const classDoc = await Class.findOne({ name: className, schoolId: req.schoolId });
    if (!classDoc) return res.status(404).json({ error: "כיתה לא נמצאה" });

    // בדיקה אם המשתמש מורה – מורה יכול להוסיף רק בכיתה שהוא מחנך שלה
    if (req.role === 'teacher' && !classDoc.homeroomTeacher.equals(req.id)) {
      return res.status(403).json({ error: "מורה יכול להוסיף או לעדכן מערכת רק בכיתה שהוא מחנך שלה" });
    }

    // הגדרת weekPlan עם כל הימים כברירת מחדל
    const defaultWeekPlan = {
      sunday: [], monday: [], tuesday: [], wednesday: [],
      thursday: [], friday: []
    };
    const weekPlanWithDefaults = { ...defaultWeekPlan, ...weekPlan };

    // קח את ה-schedule הקיים (אם קיים)
    const existingSchedule = await Schedule.findOne({ classId: classDoc._id, schoolId: req.schoolId });

    for (const day of Object.keys(weekPlanWithDefaults)) {
      weekPlanWithDefaults[day] = await Promise.all(
        weekPlanWithDefaults[day].map(async (lesson, index) => {
          const hour = school.scheduleHours[index];

          // אם השיעור ריק – אין מורה ואין מקצוע
          if (!lesson.teacherId && !lesson.subject) {
            return {
              ...lesson,
              lessonNumber: index + 1,
              teacherId: null,
              startTime: hour?.start || null,
              endTime: hour?.end || null
            };
          }

          // אחרת – טיפל במורה רגילה
          const teacher = await User.findOne({ userId: lesson.teacherId, schoolId: req.schoolId });
          if (!teacher) throw new Error(`מורה עם ת"ז ${lesson.teacherId} לא נמצא`);

          await addSubjectToTeacher(teacher._id, lesson.subject, req.schoolId);

          // בדוק אם השיעור כבר קיים ב-same schedule
          const existingLessonInSameSchedule = existingSchedule?.weekPlan[day]?.[index];
          if (!existingLessonInSameSchedule || !existingLessonInSameSchedule.teacherId.equals(teacher._id)) {
            // אם לא קיים, בדוק זמינות
            const isFree = await isTeacherFree(teacher._id, day, hour?.start, hour?.end);
            if (!isFree) {
              throw new Error(`המורה ${teacher.firstName} ${teacher.lastName} כבר מלמד/ת בשעה זו`);
            }
          }

          return {
            ...lesson,
            teacherId: teacher._id,
            lessonNumber: index + 1,
            startTime: hour?.start || null,
            endTime: hour?.end || null
          };
        })
      );
    }

    // שמירת המערכת או עדכון קיימת
    const schedule = await Schedule.findOneAndUpdate(
      { classId: classDoc._id, schoolId: req.schoolId },
      { weekPlan: weekPlanWithDefaults },
      { upsert: true, new: true }
    );

    // הוספה למערך ה-schedule של הכיתה
    if (!classDoc.schedule.includes(schedule._id)) {
      classDoc.schedule.push(schedule._id);
      await classDoc.save();
    }

    // הוספת הכיתה לכל המורים שמופיעים בשיעורים
    const teachers = new Set();
    for (const day of Object.keys(weekPlanWithDefaults)) {
      for (const lesson of weekPlanWithDefaults[day]) {
        if (lesson.teacherId) teachers.add(lesson.teacherId.toString());
      }
    }

    for (const teacherId of teachers) {
      const teacher = await User.findOne({ _id: teacherId, schoolId: req.schoolId });
      if (!teacher.classes.includes(classDoc._id)) {
        teacher.classes.push(classDoc._id);
        await teacher.save();
      }
    }

    // הוספת המורים למערך המורים של הכיתה
    for (const teacherId of teachers) {
      if (!classDoc.teachers.includes(teacherId)) {
        classDoc.teachers.push(teacherId);
      }
    }
    classDoc.schoolId = req.schoolId;
    await classDoc.save();

    res.json({ message: "מערכת נשמרה בהצלחה", schedule });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "שגיאת שרת" });
  }
};

export const updateScheduleDay = async (req, res) => {
  try {
    const { className, day, lessons } = req.body;

    // חיפוש בית הספר
    const school = await School.findById(req.schoolId);
    if (!school) return res.status(404).json({ error: "בית ספר לא נמצא" });

    // למצוא את הכיתה
    const classDoc = await Class.findOne({ name: className, schoolId: req.schoolId });
    if (!classDoc) return res.status(404).json({ error: "כיתה לא נמצאה" });

    // בדיקה אם המשתמש מורה – מורה יכול להוסיף רק בכיתה שהוא מחנך שלה
    if (req.role === 'teacher') {
      if (!classDoc.homeroomTeacher.equals(req.id)) {
        return res.status(403).json({ error: "מורה יכול להוסיף או לעדכן מערכת רק בכיתה שהוא מחנך שלה" });
      }
    }

    const existingLessons = (await Schedule.findOne({ classId: classDoc._id, schoolId: req.schoolId }))?.weekPlan[day] || [];

    // המרת ת"ז של המורים ל-ObjectId
    const lessonsWithIds = await Promise.all(
      lessons.map(async (lesson, index) => {
        const hour = school.scheduleHours[index];
        const existingLesson = existingLessons[index];

        // אם השיעור ריק – אין מורה ואין מקצוע
        if (!lesson.teacherId && !lesson.subject) {
          return {
            ...lesson,
            lessonNumber: index + 1,
            teacherId: null,
            startTime: hour?.start || null,
            endTime: hour?.end || null
          };
        }

        // טיפל במורה רגילה
        const teacher = await User.findOne({ userId: lesson.teacherId, schoolId: req.schoolId });
        if (!teacher) throw new Error(`מורה עם ת"ז ${lesson.teacherId} לא נמצא`);

        await addSubjectToTeacher(teacher._id, lesson.subject, req.schoolId);

        if (!existingLesson || !existingLesson.teacherId?.equals(teacher._id)) {
          const isFree = await isTeacherFree(teacher._id, day, hour?.start, hour?.end);
          if (!isFree) {
            throw new Error(`המורה ${teacher.firstName} ${teacher.lastName} כבר מלמד/ת בשעה זו`);
          }
        }

        return {
          ...lesson,
          lessonNumber: index + 1,
          teacherId: teacher._id,
          startTime: hour?.start || null,
          endTime: hour?.end || null
        };
      })
    );

    // עדכון רק יום אחד
    const schedule = await Schedule.findOneAndUpdate(
      { classId: classDoc._id, schoolId: req.schoolId },
      { $set: { [`weekPlan.${day}`]: lessonsWithIds } },
      { new: true, upsert: true }
    );

    // הוספת הכיתה לכל המורים שמופיעים ביום הזה
    const teachers = new Set(
      lessonsWithIds
        .map(l => l.teacherId)
        .filter(id => id)          // מסנן null
        .map(id => id.toString())
    );

    for (const teacherId of teachers) {
      const teacher = await User.findOne({ _id: teacherId, schoolId: schedule.schoolId });
      if (!teacher.classes.includes(classDoc._id)) {
        teacher.classes.push(classDoc._id);
        await teacher.save();
      }
    }

    // הוספת המורים למערך המורים של הכיתה
    for (const teacherId of teachers) {
      if (!classDoc.teachers.includes(teacherId)) {
        classDoc.teachers.push(teacherId);
      }
    }

    await classDoc.save();

    res.json({ message: `המערכת ליום ${day} עודכנה בהצלחה`, schedule });
  } catch (err) {
    res.status(500).json({ error: err.message || "שגיאת שרת" });
  }
};

export const getNextLessonForStudent = async (req, res) => {
  try {
    const studentId = req.id; // מזהה סטודנט
    const user = await User.findOne({ _id: studentId, schoolId: req.schoolId });
    if (!user) return res.status(404).json({ error: "סטודנט לא נמצא" });

    // למצוא את הכיתה שלו (לפי classes שהן ObjectId)
    const classDoc = await Class.findOne({ _id: { $in: user.classes }, schoolId: req.schoolId });
    if (!classDoc) return res.status(404).json({ error: "סטודנט לא נמצא בכיתה" });

    const schedule = await Schedule.findOne({ classId: classDoc._id, schoolId: req.schoolId });
    if (!schedule) return res.status(404).json({ error: "מערכת השיעורים לא קיימת" });

    const now = new Date();
    const daysOfWeek = ['sunday','monday','tuesday','wednesday','thursday','friday'];
    const todayDay = daysOfWeek[now.getDay()]; // היום בשבוע

    const lessons = schedule.weekPlan[todayDay] || [];
    let nextLesson = null;

    for (const lesson of lessons) {
      if (!lesson.subject || !lesson.startTime) continue; // דילוג על שיעורים ריקים
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
    const teacher = await User.findOne({ _id: teacherId, schoolId: req.schoolId });
    if (!teacher) return res.status(404).json({ error: "מורה לא נמצא" });

    const classes = teacher.classes; // מערך ObjectId
    if (!classes || classes.length === 0)
      return res.status(404).json({ error: "המורה לא מלמד בכיתות כלשהן" });

    const schedules = await Schedule.find({ classId: { $in: classes }, schoolId: req.schoolId });
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
        if (!lesson.teacherId || !lesson.subject) continue;
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
          .filter(lesson => lesson.teacherId && lesson.subject && lesson.teacherId.toString() === teacherId.toString())
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
