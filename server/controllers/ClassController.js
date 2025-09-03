import ClassModel from '../models/Class.js';
import User from '../models/User.js';

export const createClass = async (req, res) => {
  try {
    const { name, homeroomTeacher, students } = req.body;

    // בדיקה שהמחנכת קיימת
    const teacher = await User.findOne({ userId: homeroomTeacher });
    if (!teacher) {
      return res.status(404).json({ message: 'Homeroom teacher not found' });
    }

    // בדיקה שכל התלמידים קיימים
    let validStudents = [];
    if (students && students.length > 0) {
      const existingStudents = await User.find({ userId: { $in: students } });
      if (existingStudents.length !== students.length) {
        return res.status(400).json({ message: 'Some students not found' });
      }
      validStudents = existingStudents.map(s => s.userId); // נשמור רק userId
    }

    const newClass = new ClassModel({
      name,
      homeroomTeacher: teacher.userId,
      students: validStudents
    });

    await newClass.save();
    res.status(201).json({ message: 'Class created', newClass });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


// export const getAllClasses = async (req, res) => {
//   try {
//     const classes = await ClassModel.find().populate('students');
//     res.json(classes);
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// };


export const getAllClasses = async (req, res) => {
  try {
    const classes = await ClassModel.find();

    // נוסיף פרטי מחנכת ותלמידים ידנית
    const result = [];
    for (let cls of classes) {
      const teacher = await User.findOne({ userId: cls.homeroomTeacher });
      const students = await User.find({ userId: { $in: cls.students } });

      result.push({
        _id: cls._id,
        name: cls.name,
        homeroomTeacher: teacher ? {
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          userId: teacher.userId,
          email: teacher.email
        } : null,
        students: students.map(s => ({
          firstName: s.firstName,
          lastName: s.lastName,
          userId: s.userId,
          email: s.email
        }))
      });
    }

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
