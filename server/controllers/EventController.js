import Event from '../models/Event.js';
import Class from '../models/Class.js';
import EventService from '../services/EventService.js';
import { generateCode } from '../utils/generatedCode.js';
import User from '../models/User.js';
import { markRowsProcessedByAbsenceCode } from '../utils/googleSheets.js';

export const checkEventOverlap = async ({ date, startTime, endTime, classIds, excludeEventId = null }) => {
  const query = {
    date: new Date(date),
    classes: { $in: classIds },
    $or: [
      {
        startTime: { $lt: endTime },
        endTime: { $gt: startTime }
      }
    ]
  };

  if (excludeEventId) {
    query._id = { $ne: excludeEventId };
  }

  const overlappingEvents = await Event.find(query);
  return overlappingEvents.length > 0;
};

export const addEvent = async (req, res) => {
  try {
    const { type, date, classes, startTime, endTime, title, description } = req.body;
  
    // בדיקות חובה
    if (!type || !date || !classes || classes.length === 0 || !title) {
      console.log('Missing required fields:');
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // המרה משמות כיתות ל־ObjectIds
    const foundClasses = await Class.find({ _id: { $in: classes }, schoolId: req.schoolId });

    if (type === 'trip' || type === 'activity') 
      {
      if (req.role !== 'admin') 
        return res.status(403).json({ message: 'רק מנהלת יכולה ליצור אירועים כאלה' });
      }
    else if (type === 'exam')
      {
        if (req.role !== 'teacher')
          return res.status(403).json({ message: 'רק מורה יכולה ליצור אירועים כאלה' });
        if(!req.body.subject)
          return res.status(400).json({ message: 'Missing subject for exam event' });
        
        //למצוא את המורה בטבלת users באמצעות req.id
        const teacher = await User.findOne({ _id: req.id, schoolId: req.schoolId });
        //אם לא מלמדת את המקצוע הזה- שגיאה אלא אם כן היא מחנכת
        if(!teacher.ishomeroom && (!teacher.subjects || !teacher.subjects.includes(req.body.subject)))
          return res.status(403).json({ message: 'מורה יכול ליצור אירוע מבחן רק למקצועות שהוא מלמד' });
        //לבדוק אם השדה classes שלו מכיל objectId את הכיתות במערך שהתקבל מהבקשה
        const inputClassIds = foundClasses.map(c => c._id.toString());
        const teacherClassIds = teacher.classes.map(c => c.toString());
        const canCreate = inputClassIds.every(c => teacherClassIds.includes(c));
        if (!canCreate)
          return res.status(403).json({ message: 'מורה יכול ליצור אירוע מבחן רק לכיתות שהוא מלמד' });

      }
    if (foundClasses.length !== classes.length) {
      return res.status(400).json({ message: 'One or more classes not found' });
    }
    const classIds = foundClasses.map(c => c._id);

    const eventId = generateCode(); // עכשיו זה אחרי כל הבדיקות

    const hasOverlap = await checkEventOverlap({ date, startTime, endTime, classIds });
    if (hasOverlap) {
      return res.status(400).json({ message: 'אירוע כבר קיים בכיתה אחת או יותר בשעות האלה' });
    }
    // יצירת האירוע במסד
    const event = new Event({
      eventId,
      schoolId: req.schoolId,
      type,
      title,
      description,
      date,
      startTime,
      endTime,
      classes: classIds,
      createdBy: req.id
    });

     if(type === 'exam') {
      event.subject = req.body.subject;
      if(req.body.notes) event.notes = req.body.notes;
      event.targetTeacher = req.body.targetTeacher || req.id; // איתחול ליוצר אם לא הוזן
    }
    await event.save();

    //  כאן מזמנים את הלוגיקה העסקית
    await EventService.applyEventImpact(event);
    // await EventService.sendNotifications(event);

    res.status(201).json({ message: 'Event added', event });
  } catch (err) {
    console.error('Error adding event:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getEvents = async (req, res) => {
  try {
    const events = await Event.find({ schoolId: req.schoolId })
      .populate('classes', 'name')
      .sort({ date: 1 });

    res.json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findOne({ eventId, schoolId: req.schoolId }).populate('classes', 'name');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { type, date, classes, startTime, endTime, title, description } = req.body;

    // שליפת האירוע
    const event = await Event.findOne({ _id: eventId, schoolId: req.schoolId }).populate("classes", "name");
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // בדיקה שרק היוצר יכול לעדכן
    if (event.createdBy.toString() !== req.id) {
            if (event.type !== 'exam' || !event.targetTeacher.toString() === req.id)
      return res.status(403).json({ message: 'Only the creator can update this event' });
    }

    // הכנה לעדכון
    const updateData = {};
    if (type) updateData.type = type;
    if (date) updateData.date = date;
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (startTime) updateData.startTime = startTime;
    if (endTime) updateData.endTime = endTime;
    if (req.body.subject) updateData.subject = req.body.subject;
    if (req.body.notes) updateData.notes = req.body.notes;
    if (req.body.targetTeacher) updateData.targetTeacher = req.body.targetTeacher;

    // ברירת מחדל - הכיתות הנוכחיות (array of ObjectId / strings)
    let classIds = event.classes ? event.classes.map(c => c._id.toString()) : [];

    // אם התקבל מערך כיתות בעדכון — אשר/שאילתא נכונה ומעדכן גם classIds
    if (Array.isArray(classes) && classes.length > 0) {
      // חשוב: use classes directly (array of ids). קודם הבדק שכולם תקינים מבחינת פורמט (optional)
      // המופע הבעייתי היה שימוש ב-classes._id -> זה חסר משמעות כש-classes הוא מערך
      const foundClasses = await Class.find({ _id: { $in: classes }, schoolId: req.schoolId });

      // אם לא נמצאו כל הכיתות — החזרת שגיאה עם לוג מסודר
      if (foundClasses.length !== classes.length) {
        const foundIds = foundClasses.map(fc => fc._id.toString());
        const missing = classes.filter(c => !foundIds.includes(c.toString()));
        return res.status(400).json({ message: 'One or more classes not found', missing });
      }

      // עדכון הנתונים והכנת classIds לבדיקות חפיפה
      updateData.classes = foundClasses.map(c => c._id);
      classIds = foundClasses.map(c => c._id.toString());
    }

    // בדיקת חפיפה: רצה רק אם יש זמני התחלה/סיום ולפחות כיתה אחת רלוונטית
    const shouldCheckOverlap = (startTime || endTime || date || (Array.isArray(classes) && classes.length > 0))
                               && startTime && endTime && classIds.length > 0;

    if (shouldCheckOverlap) {
      const hasOverlap = await checkEventOverlap({
        date: date || event.date,
        startTime: startTime || event.startTime,
        endTime: endTime || event.endTime,
        classIds, // עכשיו זה המערך המעודכן של ids (strings/ObjectIds)
        excludeEventId: event._id // חשוב כדי לא להיתקע על עצמו
      });

      if (hasOverlap) {
        return res.status(400).json({ message: 'אירוע כבר קיים לכיתה אחת או יותר בשעות האלה' });
      }
    }

    // עדכון ושמירה
    Object.assign(event, updateData);
    await event.save();

    // זימון הלוגיקה העסקית לאחר עדכון
    await EventService.applyEventImpact(event);
    // await EventService.sendNotifications(event);

    res.json({ message: 'Event updated', event });
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    let event = await Event.findOne({ _id: eventId, schoolId: req.schoolId });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // בדיקה שרק היוצר יכול למחוק
    if (event.createdBy.toString() !== req.id) {
              if(event.type!=='exam' || !event.targetTeacher.toString()===req.id)
      return res.status(403).json({ message: 'Only the creator can delete this event' });
    }

    //  זימון הלוגיקה העסקית לפני המחיקה
    await EventService.revertEventImpact(event);
    await event.deleteOne({ _id: event._id });

    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUpcomingExams = async (req, res) => {
  try {
    // 1. מציאת התלמיד והכיתות שלו
    const student = await User.findById(req.id).populate('classes');
    if (!student || !student.classes.length) {
      return res.status(404).json({ message: "Student or student's classes not found" });
    }

    const classIds = student.classes.map(c => c._id);

    // 2. שליפת כל אירועי המבחן הקרובים לכיתות שלו
    const exams = await Event.find({
      type: 'exam',
      classes: { $in: classIds },
      date: { $gte: new Date() } // רק מבחנים מהיום והלאה
    })
    .populate('classes', 'name')
    .populate('createdBy', 'firstName lastName')
    .populate('targetTeacher', 'firstName lastName')
    .sort({ date: 1, startTime: 1 });

    res.status(200).json(exams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching upcoming exams', error });
  }
};

export const getNextExam = async (req, res) => {
  try {
    const student = await User.findById(req.id).populate('classes');
    if (!student || !student.classes.length) {
      return res.status(404).json({ message: "Student or student's classes not found" });
    }

    const classIds = student.classes.map(c => c._id);

    // שליפת המבחן הקרוב ביותר
    const nextExam = await Event.findOne({
      type: 'exam',
      classes: { $in: classIds },
      date: { $gte: new Date() }
    })
    .populate('classes', 'name')
    .populate('createdBy', 'firstName lastName')
    .sort({ date: 1, startTime: 1 });

    if (!nextExam) {
      return res.status(404).json({ message: 'No upcoming exams found' });
    }

    res.status(200).json(nextExam);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching next exam', error });
  }
};