import Class from '../models/Class.js';
import User from '../models/User.js';

export const createClass = async (req, res) => {
  try {
    const { name, homeroomTeacher, students } = req.body;

    // לבדוק אם כבר קיימת כיתה בשם הזה באותו בית ספר
    const existingClass = await Class.findOne({ name, schoolId: req.schoolId });
    if (existingClass) {
      return res.status(400).json({ message: 'Class with this name already exists in this school' });
    }

    // לאתר מחנכת לפי ת"ז, לוודא שהיא מורה ושייכת לאותו בית ספר
    const teacher = await User.findOne({ userId: homeroomTeacher, role: 'teacher', schoolId: req.schoolId });
    if (!teacher) return res.status(404).json({ message: 'Homeroom teacher not found in this school' });

    // לוודא שהיא לא מחנכת כבר בכיתה אחרת באותו בית ספר
    const teacherInAnotherClass = await Class.findOne({ homeroomTeacher: teacher._id, schoolId: req.schoolId });
    if (teacherInAnotherClass) {
      return res.status(400).json({ message: 'This teacher is already homeroom teacher of another class' });
    }

    // בדיקת תלמידים
    let validStudents = [];
    if (students && students.length > 0) {
      const existingStudents = await User.find({
        userId: { $in: students },
        role: 'student',
        schoolId: req.schoolId
      });

      if (existingStudents.length !== students.length) {
        return res.status(400).json({ message: 'Some students not found in this school' });
      }

      for (let student of existingStudents) {
        const studentInClass = await Class.findOne({ students: student._id, schoolId: req.schoolId });
        if (studentInClass) {
          return res.status(400).json({ message: `Student ${student.userId} is already in another class` });
        }
      }
      validStudents = existingStudents.map(s => s._id);
    }

    const newClass = new Class({
      name,
      homeroomTeacher: teacher._id,
      students: validStudents,
      schoolId: req.schoolId
    });
    await newClass.save();

    // עדכון המחנכת
    if (!teacher.classes.includes(newClass._id)) {
      teacher.classes.push(newClass._id);
      await teacher.save();
    }
    //עדכון השדה isHomeroom ב-User
    teacher.ishomeroom = true;
    await teacher.save();

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
    const { teacherId } = req.body;

    const classDoc = await Class.findOne({ name: className, schoolId: req.schoolId });
    if (!classDoc) return res.status(404).json({ message: 'Class not found in this school' });

    const newTeacher = await User.findOne({ userId: teacherId, role: 'teacher', schoolId: req.schoolId });
    if (!newTeacher) return res.status(404).json({ message: 'Teacher not found in this school' });

    const alreadyHomeroom = await Class.findOne({ homeroomTeacher: newTeacher._id, schoolId: req.schoolId });
    if (alreadyHomeroom && alreadyHomeroom.name !== className) {
      return res.status(400).json({ message: 'This teacher is already homeroom teacher in another class' });
    }

    // הסרת הכיתה ממחנכת קודמת
    if (classDoc.homeroomTeacher) {
      const oldTeacher = await User.findById(classDoc.homeroomTeacher);
      if (oldTeacher) {
        oldTeacher.classes = oldTeacher.classes.filter(cId => !cId.equals(classDoc._id));
        oldTeacher.ishomeroom = false; //מורה לא יכולה להיות מחנכת ב2 כיתות 
        await oldTeacher.save();
      }
    }

    // עדכון מחנכת חדשה
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
    const deletedClass = await Class.findOneAndDelete({ name, schoolId: req.schoolId });
    if (!deletedClass) return res.status(404).json({ message: 'Class not found in this school' });

    // הסרת הכיתה ממחנכת
    if (deletedClass.homeroomTeacher) {
      const teacher = await User.findById(deletedClass.homeroomTeacher);
      if (teacher) {
        teacher.classes = teacher.classes.filter(cId => !cId.equals(deletedClass._id));
        teacher.ishomeroom = false; //מורה לא יכולה להיות מחנכת ב2 כיתות בכל מקרה....
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

    const classObj = await Class.findOne({ name: className, schoolId: req.schoolId });
    if (!classObj) return res.status(404).json({ message: 'Class not found in this school' });

    const student = await User.findOne({ userId: studentId, role: 'student', schoolId: req.schoolId });
    if (!student) return res.status(404).json({ message: 'Student not found in this school' });

    const studentInAnotherClass = await Class.findOne({ students: student._id, schoolId: req.schoolId });
    if (studentInAnotherClass) {
      return res.status(400).json({ message: `Student ${student.userId} is already in another class` });
    }

    if (classObj.students.includes(student._id)) {
      return res.status(400).json({ message: 'Student already in this class' });
    }

    classObj.students.push(student._id);
    await classObj.save();

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

    const classObj = await Class.findOne({ name: className, schoolId: req.schoolId });
    if (!classObj) return res.status(404).json({ message: 'Class not found in this school' });

    const student = await User.findOne({ userId: studentId, role: 'student', schoolId: req.schoolId });
    if (!student) return res.status(404).json({ message: 'Student not found in this school' });

    classObj.students = classObj.students.filter(id => !id.equals(student._id));
    await classObj.save();

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
    const classes = await Class.find({ schoolId: req.schoolId })
      .populate('homeroomTeacher', 'userId firstName lastName')
      .populate('students', 'userId firstName lastName');
    res.json(classes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getStudentsByClass = async (req, res) => {
  try {
    const { className } = req.params;
    const classObj = await Class.findOne({ name: className, schoolId: req.schoolId })
      .populate('students', 'userId firstName lastName email phone');
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found in this school' });
    }
    res.json(classObj.students || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
