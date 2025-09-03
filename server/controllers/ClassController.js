import ClassModel from '../models/Class.js';
import User from '../models/User.js';

export const createClass = async (req, res) => {
  try {
    const { name, homeroomTeacher, students } = req.body;

    // בדיקה שהכיתה לא קיימת כבר
    const existingClass = await ClassModel.findOne({ name });
    if (existingClass) {
      return res.status(400).json({ message: 'Class with this name already exists' });
    }

    // בדיקה שהמחנכת קיימת
    const teacher = await User.findOne({ userId: homeroomTeacher });
    if (!teacher) {
      return res.status(404).json({ message: 'Homeroom teacher not found' });
    }

    // בדיקה שהמחנכת לא מחנכת בכיתה אחרת
    const teacherInAnotherClass = await ClassModel.findOne({ homeroomTeacher: teacher._id });
    if (teacherInAnotherClass) {
      return res.status(400).json({ message: 'This teacher is already homeroom teacher of another class' });
    }

    // בדיקה שכל התלמידים קיימים ושאינם בכיתה אחרת
    let validStudents = [];
    if (students && students.length > 0) {
      const existingStudents = await User.find({ userId: { $in: students } });
      if (existingStudents.length !== students.length) {
        return res.status(400).json({ message: 'Some students not found' });
      }

      // בדיקה שתלמיד לא נמצא כבר בכיתה אחרת
      for (let student of existingStudents) {
        const studentInClass = await ClassModel.findOne({ students: student._id });
        if (studentInClass) {
          return res.status(400).json({ message: `Student ${student.userId} is already in another class` });
        }
      }
      validStudents = existingStudents.map(s => s._id);
    }

    const newClass = new ClassModel({
      name,
      homeroomTeacher: teacher._id,
      students: validStudents
    });

    await newClass.save();
    res.status(201).json({ message: 'Class created', newClass });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllClasses = async (req, res) => {
  try {
    const classes = await ClassModel.find()
      .populate('homeroomTeacher', 'userId name')
      .populate('students', 'userId name');
    res.json(classes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const { name } = req.params;
    const deletedClass = await ClassModel.findOneAndDelete({ name });
    if (!deletedClass) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json({ message: 'Class deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addStudentToClass = async (req, res) => {
  try {
    const { className, studentId } = req.body;

    const classObj = await ClassModel.findOne({ name: className });
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const student = await User.findOne({ userId: studentId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // בדיקה שהתלמיד לא נמצא בכיתה אחרת
    const studentInAnotherClass = await ClassModel.findOne({ students: student._id });
    if (studentInAnotherClass) {
      return res.status(400).json({ message: `Student ${student.userId} is already in another class` });
    }

    // בדיקה שהתלמיד לא כבר בכיתה הזו
    if (classObj.students.includes(student._id)) {
      return res.status(400).json({ message: 'Student already in this class' });
    }

    classObj.students.push(student._id);
    await classObj.save();
    res.json({ message: 'Student added', class: classObj });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const removeStudentFromClass = async (req, res) => {
  try {
    const { className, studentId } = req.body;

    const classObj = await ClassModel.findOne({ name: className });
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const student = await User.findOne({ userId: studentId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    classObj.students = classObj.students.filter(id => !id.equals(student._id));
    await classObj.save();
    res.json({ message: 'Student removed', class: classObj });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateHomeroomTeacher = async (req, res) => {
  try {
    const { name } = req.params; // שם הכיתה
    const { homeroomTeacher, students } = req.body;

    const classObj = await ClassModel.findOne({ name });
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (homeroomTeacher) {
      const teacher = await User.findOne({ userId: homeroomTeacher });
      if (!teacher) {
        return res.status(404).json({ message: 'Homeroom teacher not found' });
      }

      const teacherInAnotherClass = await ClassModel.findOne({ homeroomTeacher: teacher._id, _id: { $ne: classObj._id } });
      if (teacherInAnotherClass) {
        return res.status(400).json({ message: 'This teacher is already homeroom teacher of another class' });
      }

      classObj.homeroomTeacher = teacher._id;
    }

    if (students && students.length > 0) {
      // בדיקה שכל התלמידים קיימים ושאינם בכיתה אחרת
      const existingStudents = await User.find({ userId: { $in: students } });
      if (existingStudents.length !== students.length) {
        return res.status(400).json({ message: 'Some students not found' });
      }

      for (let student of existingStudents) {
        const studentInAnotherClass = await ClassModel.findOne({ students: student._id, _id: { $ne: classObj._id } });
        if (studentInAnotherClass) {
          return res.status(400).json({ message: `Student ${student.userId} is already in another class` });
        }
      }

      classObj.students = existingStudents.map(s => s._id);
    }

    await classObj.save();
    res.json({ message: 'Class updated', class: classObj });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
