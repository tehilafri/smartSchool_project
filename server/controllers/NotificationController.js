import Notification from '../models/Notification.js';

export const createNotification = async (req, res) => {
  try {
    const { title, message, recipient } = req.body;
    const notification = new Notification({ title, message, recipient });
    await notification.save();
    res.status(201).json({ message: 'Notification sent', notification });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getNotificationsForUser = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.userId });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
