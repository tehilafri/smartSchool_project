import ClassModel from '../models/Class.js';

export const createClass = async (req, res) => {
  try {
    const { name, students } = req.body;
    const newClass = new ClassModel({ name, students });
    await newClass.save();
    res.status(201).json({ message: 'Class created', newClass });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllClasses = async (req, res) => {
  try {
    const classes = await ClassModel.find().populate('students');
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
