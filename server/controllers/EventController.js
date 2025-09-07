import Event from '../models/Event.js';
import Class from '../models/Class.js';
import EventService from '../services/EventService.js';
import { generateCode } from '../utils/generatedCode.js';
import User from '../models/User.js';

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
    const { type, date, classes, startTime, endTime, title } = req.body;
  
    // בדיקות חובה
    if (!type || !date || !classes || classes.length === 0 || !title) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // המרה משמות כיתות ל־ObjectIds
    const foundClasses = await Class.find({ name: { $in: classes } });

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
        const teacher = await User.findById(req.id);
        console.log(teacher.userName);
        //אם לא מלמדת את המקצוע הזה- שגיאה אלא אם כן היא מחנכת
        if(!teacher.ishomeroom && (!teacher.subjects || !teacher.subjects.includes(req.body.subject)))
          return res.status(403).json({ message: 'מורה יכול ליצור אירוע מבחן רק למקצועות שהוא מלמד' });
        //לבדוק אם השדה classes שלו מכיל objectId את הכיתות במערך שהתקבל מהבקשה
        console.log(foundClasses);
        console.log(teacher.classes);
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
      type,
      title,
      date,
      startTime,
      endTime,
      classes: classIds,
      createdBy: req.id
    });

    if(type === 'exam')
      event.subject = req.body.subject;

    await event.save();

    // 🟢 כאן בדיוק מזמנים את הלוגיקה העסקית
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
    const events = await Event.find()
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
    const event = await Event.findOne({ eventId }).populate('classes', 'name');

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
    const { type, date, classes, startTime, endTime, title } = req.body;

    // שליפת האירוע
    const event = await Event.findOne({ eventId }).populate('classes', 'name');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // בדיקה שרק היוצר יכול לעדכן
    if (event.createdBy.toString() !== req.id) {
      return res.status(403).json({ message: 'Only the creator can update this event' });
    }

    // הכנה לעדכון
    const updateData = {};
    if (type) updateData.type = type;
    if (date) updateData.date = date;
    if (title) updateData.title = title;
    if (startTime) updateData.startTime = startTime;
    if (endTime) updateData.endTime = endTime;

    let classIds = event.classes.map(c => c._id); // ברירת מחדל - הכיתות הקיימות

    if (classes && classes.length > 0) {
      const foundClasses = await Class.find({ name: { $in: classes } });
      if (foundClasses.length !== classes.length) {
        return res.status(400).json({ message: 'One or more classes not found' });
      }
      classIds = foundClasses.map(c => c._id);
      updateData.classes = classIds;
    }

    // 🟢 בדיקת חפיפה
    if ((date || startTime || endTime || classes) && (startTime && endTime && classIds.length > 0)) {
      const hasOverlap = await checkEventOverlap({
        date: date || event.date,
        startTime: startTime || event.startTime,
        endTime: endTime || event.endTime,
        classIds,
        excludeEventId: event._id // חשוב כדי לא להיתקע על עצמו
      });

      if (hasOverlap) {
        return res.status(400).json({ message: 'אירוע כבר קיים לכיתה אחת או יותר בשעות האלה' });
      }
    }

    // עדכון האירוע
    Object.assign(event, updateData);
    await event.save();

    // 🟢 זימון הלוגיקה העסקית לאחר עדכון
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
    const event = await Event.findOne({ eventId });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // בדיקה שרק היוצר יכול למחוק
    if (event.createdBy.toString() !== req.id) {
      return res.status(403).json({ message: 'Only the creator can delete this event' });
    }

    // 🟢 זימון הלוגיקה העסקית לפני המחיקה
    await EventService.revertEventImpact(event);
    await event.remove();

    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

