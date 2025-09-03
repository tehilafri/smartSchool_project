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
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // למצוא את הכיתה ולוודא שהמורה שייכת אליה
    const schoolClass = await Class.findOne({
      name: className,
      $or: [
        { homeroomTeacher: teacher._id },
        { teachers: teacher._id }
      ]
    });

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
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


export const approveReplacement = async (req, res) => {
  try {
    const { absenceId, firstName, lastName, email, notes } = req.body;

    const absence = await SubstituteRequest.findById(absenceId);
    if (!absence) return res.status(404).json({ message: 'Absence not found' });

    // הרשאה – רק מי שיצר את הבקשה יכול לאשר
    if (absence.originalTeacherId.toString() !== req.id) {
      return res.status(403).json({ message: 'You are not allowed to approve this request' });
    }

    if (absence.status === 'accepted') {
      return res.json({ message: 'Replacement already approved' });
    }

    absence.status = 'accepted';
    absence.response = { firstName, lastName, email, notes };
    await absence.save();

    // שליחת מייל – כאן אפשר לבחור אם בכלל צריך,
    // כי זה אותו מורה שמאשר לעצמו
    await sendEmail(
      email,
      'Replacement approved',
      `You have been approved as a substitute for ${absence.subject}`
    );

    res.json({ message: 'Replacement approved', absence });
  } catch (err) {
    console.error(err);
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

