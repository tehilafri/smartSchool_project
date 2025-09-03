import mongoose from 'mongoose';
import SubstituteRequest from '../models/SubstituteRequest.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/email.js';
import Class from '../models/Class.js';

export const reportAbsence = async (req, res) => {
  try {
    const { date, startTime, endTime, subject, className, reason } = req.body;

    // למצוא את המורה המדווחת לפי ה־ID מהטוקן
    const teacher = await User.findById(req.id);
    console.log("Reported by teacher ID:", req.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // למצוא את הכיתה לפי שם, ולוודא שהמורה שייכת אליה
    const schoolClass = await Class.findOne({ 
      name: className,
      $or: [
        { homeroomTeacher: new mongoose.Types.ObjectId(teacher._id) },
        { teachers: new mongoose.Types.ObjectId(teacher._id) }
      ]
    });
    
    const c = await Class.findOne({ name: className });
    console.log('className from req:', className, typeof className);
    console.log('homeroomTeacher in DB:', c.homeroomTeacher, typeof c.homeroomTeacher);
    console.log("Class found:", schoolClass);

    if (!schoolClass) {
      return res.status(403).json({ message: 'You are not assigned to this class' });
    }

    // יצירת בקשת היעדרות
    const absence = new SubstituteRequest({
      originalTeacherId: teacher._id,
      date,
      startTime,
      endTime,
      subject,
      classId: schoolClass._id,
      reason,
      status: 'pending'
    });

    await absence.save();
    res.status(201).json({ message: 'Absence reported', absence });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const approveReplacement = async (req, res) => {
  try {
    const {absenceId,firstName,lastName,email,notes} = req.body;

    const absence = await SubstituteRequest.findById(absenceId);
    if (!absence) return res.status(404).json({ message: 'Absence not found' });

    if(absence.status == 'accepted')
        return res.json({ message: 'Replacement already approved' });

    absence.status = 'accepted';
    absence.response = { firstName, lastName, email ,notes};
    await absence.save();

    const originalTeacher = await User.findById(absence.originalTeacherId);
    await sendEmail(originalTeacher.email, 'The matter has been resolved', `The teacher ${firstName} ${lastName} with email: ${email} will cover your lesson`);

    res.json({ message: 'Replacement approved' });
    
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getSubstituteRequests = async (req, res) => {
  try {
    const requests = await SubstituteRequest.find()
      .populate('originalTeacherId', 'firstName lastName email')  // רק שדות רלוונטיים
      .populate('substituteTeacherId', 'firstName lastName email');

    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

