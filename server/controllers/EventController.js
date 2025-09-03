import Event from '../models/Event.js';
import Class from '../models/Class.js';


export const addEvent = async (req, res) => {
  try {
    const { eventId, type, date, classes, startTime, endTime, title } = req.body;

    // בדיקות חובה
    if (!eventId || !type || !date || !classes || classes.length === 0 || !title) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // בדיקה שאין כפילות באירוע עם אותו eventId
    const existingEvent = await Event.findOne({ eventId });
    if (existingEvent) {
      return res.status(400).json({ message: 'Event with this eventId already exists' });
    }

    // המרה משמות כיתות ל־ObjectIds
    const foundClasses = await Class.find({ name: { $in: classes } });
    if (foundClasses.length !== classes.length) {
      return res.status(400).json({ message: 'One or more classes not found' });
    }

    const classIds = foundClasses.map(c => c._id);

    const event = new Event({
      eventId,
      type,
      title,
      date,
      startTime,
      endTime,
      classes: classIds
    });

    await event.save();
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

    const updateData = {};
    if (type) updateData.type = type;
    if (date) updateData.date = date;
    if (title) updateData.title = title;
    if (startTime) updateData.startTime = startTime;
    if (endTime) updateData.endTime = endTime;

    if (classes && classes.length > 0) {
      const foundClasses = await Class.find({ name: { $in: classes } });
      if (foundClasses.length !== classes.length) {
        return res.status(400).json({ message: 'One or more classes not found' });
      }
      updateData.classes = foundClasses.map(c => c._id);
    }
    const event = await Event.findOneAndUpdate(
      { eventId },
      updateData,
      { new: true }
    ).populate('classes', 'name');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event updated', event });
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findOneAndDelete({ eventId });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
