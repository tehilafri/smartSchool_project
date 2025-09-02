import Event from '../models/Event.js';

export const addEvent = async (req, res) => {
  try {
    const { type, date, classId, duration } = req.body;
    const event = new Event({ type, date, classId, duration });
    await event.save();

    // TODO: עדכון מערכת השעות לפי סוג האירוע
    res.status(201).json({ message: 'Event added', event });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
