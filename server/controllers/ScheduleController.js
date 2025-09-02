import Schedule from '../models/Schedule.js';

export const getNextLessonForStudent = async (req, res) => {
  try {
    const studentId = req.userId;
    const now = new Date();

    const nextLesson = await Schedule.findOne({
      student: studentId,
      date: { $gte: now }
    }).sort('date');

    res.json({ nextLesson });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getScheduleByTeacher = async (req, res) => {
  try {
    const teacherId = req.userId;
    const schedule = await Schedule.find({ teacher: teacherId });
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
