import ChatQuery from '../models/ChatQuery.js';

export const createQuery = async (req, res) => {
  try {
    const { question } = req.body;
    const userId = req.userId;

    const chatQuery = new ChatQuery({ user: userId, question });
    await chatQuery.save();

    // TODO: כאן אפשר לשלב AI או שליפת מידע מבסיס הנתונים
    res.status(201).json({ message: 'Query saved', chatQuery });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getQueries = async (req, res) => {
  try {
    const queries = await ChatQuery.find({ user: req.userId });
    res.json(queries);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
