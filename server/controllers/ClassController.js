import Class from '../models/Class.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

export const createClass = async (req, res) => {
  try {
    const { name, homeroomTeacher, students } = req.body;

    const existingClass = await Class.findOne({ name });
    if (existingClass) {
      return res.status(400).json({ message: 'Class with this name already exists' });
    }

    const teacher = await User.findOne({ userId: homeroomTeacher, role: 'teacher' });
    if (!teacher) return res.status(404).json({ message: 'Homeroom teacher not found' });

    const teacherInAnotherClass = await Class.findOne({ homeroomTeacher: teacher._id });
    if (teacherInAnotherClass) {
      return res.status(400).json({ message: 'This teacher is already homeroom teacher of another class' });
    }

    let validStudents = [];
    if (students && students.length > 0) {
      const existingStudents = await User.find({ userId: { $in: students }, role: 'student' });
      if (existingStudents.length !== students.length) {
        return res.status(400).json({ message: 'Some students not found' });
      }

      for (let student of existingStudents) {
        const studentInClass = await Class.findOne({ students: student._id });
        if (studentInClass) {
          return res.status(400).json({ message: `Student ${student.userId} is already in another class` });
        }
      }
      validStudents = existingStudents.map(s => s._id);
    }

    const newClass = new Class({
      name,
      homeroomTeacher: teacher._id,
      students: validStudents
    });
    await newClass.save();

    // עדכון המחנכת
    if (!teacher.classes.includes(newClass._id)) {
      teacher.classes.push(newClass._id);
      await teacher.save();
    }

    // עדכון תלמידים
    if (validStudents.length > 0) {
      await User.updateMany(
        { _id: { $in: validStudents } },
        { $push: { classes: newClass._id } }
      );
    }

    res.status(201).json({ message: 'Class created', newClass });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateHomeroomTeacher = async (req, res) => {
  try {
    const { className } = req.params;
    const { newHomeroomTeacherId } = req.body;

    const classDoc = await Class.findOne({ name: className });
    if (!classDoc) return res.status(404).json({ message: 'Class not found' });

    const newTeacher = await User.findOne({ userId: newHomeroomTeacherId, role: 'teacher' });
    if (!newTeacher) return res.status(404).json({ message: 'Teacher not found' });

    const alreadyHomeroom = await Class.findOne({ homeroomTeacher: newTeacher._id });
    if (alreadyHomeroom && alreadyHomeroom.name !== className) {
      return res.status(400).json({ message: 'This teacher is already homeroom teacher in another class' });
    }

    // הסרת הכיתה ממחנכת קודמת
    if (classDoc.homeroomTeacher) {
      const oldTeacher = await User.findById(classDoc.homeroomTeacher);
      if (oldTeacher) {
        oldTeacher.classes = oldTeacher.classes.filter(cId => !cId.equals(classDoc._id));
        await oldTeacher.save();
      }
    }

    // עדכון המחנכת החדשה
    classDoc.homeroomTeacher = newTeacher._id;
    await classDoc.save();

    if (!newTeacher.classes.includes(classDoc._id)) {
      newTeacher.classes.push(classDoc._id);
      await newTeacher.save();
    }

    res.json({ message: 'Homeroom teacher updated successfully', class: classDoc });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const { name } = req.params;
    const deletedClass = await Class.findOneAndDelete({ name });
    if (!deletedClass) return res.status(404).json({ message: 'Class not found' });

    // הסרת הכיתה ממחנכת
    if (deletedClass.homeroomTeacher) {
      const teacher = await User.findById(deletedClass.homeroomTeacher);
      if (teacher) {
        teacher.classes = teacher.classes.filter(cId => !cId.equals(deletedClass._id));
        await teacher.save();
      }
    }

    // הסרת הכיתה מכל התלמידים
    if (deletedClass.students && deletedClass.students.length > 0) {
      await User.updateMany(
        { _id: { $in: deletedClass.students } },
        { $pull: { classes: deletedClass._id } }
      );
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

    const classObj = await Class.findOne({ name: className });
    if (!classObj) return res.status(404).json({ message: 'Class not found' });

    const student = await User.findOne({ userId: studentId, role: 'student' });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // בדיקה אם תלמיד כבר בכיתה אחרת
    const studentInAnotherClass = await Class.findOne({ students: student._id });
    if (studentInAnotherClass) {
      return res.status(400).json({ message: `Student ${student.userId} is already in another class` });
    }

    if (classObj.students.includes(student._id)) {
      return res.status(400).json({ message: 'Student already in this class' });
    }

    classObj.students.push(student._id);
    await classObj.save();

    // עדכון המערך של תלמיד
    if (!student.classes.includes(classObj._id)) {
      student.classes.push(classObj._id);
      await student.save();
    }

    res.json({ message: 'Student added', class: classObj });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const removeStudentFromClass = async (req, res) => {
  try {
    const { className, studentId } = req.body;

    const classObj = await Class.findOne({ name: className });
    if (!classObj) return res.status(404).json({ message: 'Class not found' });

    const student = await User.findOne({ userId: studentId, role: 'student' });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    classObj.students = classObj.students.filter(id => !id.equals(student._id));
    await classObj.save();

    // עדכון תלמיד – הסרת הכיתה ממערך ה־classes
    student.classes = student.classes.filter(cId => !cId.equals(classObj._id));
    await student.save();

    res.json({ message: 'Student removed', class: classObj });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


export const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('homeroomTeacher', 'userId name')
      .populate('students', 'userId name');
    res.json(classes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};