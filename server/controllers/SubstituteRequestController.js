import mongoose from 'mongoose';
import SubstituteRequest from '../models/SubstituteRequest.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/email.js';
import Class from '../models/Class.js';
import ExternalSubstitute from '../models/ExternalSubstitute.js';

function generateAbsenceCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const reportAbsence = async (req, res) => {
  try {
    const { date, startTime, endTime, subject, className, reason } = req.body;

    const teacher = await User.findById(req.id);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

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

    const absenceCode = generateAbsenceCode();

    const absence = new SubstituteRequest({
      originalTeacherId: teacher._id,
      date,
      startTime,
      endTime,
      subject,
      classId: schoolClass._id,
      reason,
      status: 'pending',
      absenceCode
    });

    await absence.save();
    res.status(201).json({ message: 'Absence reported', code: absenceCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const approveReplacement = async (req, res) => {
  try {
    const { absenceCode, firstName, lastName, email, notes, identityNumber } = req.body;

    // חיפוש בקשת ההיעדרות לפי הקוד
    const absence = await SubstituteRequest.findOne({ absenceCode });
    if (!absence) return res.status(404).json({ message: "Absence not found" });

    // רק מי שיצר את הבקשה יכול לאשר אותה
    if (absence.originalTeacherId.toString() !== req.id) {
      return res.status(403).json({ message: "You are not allowed to approve this request" });
    }

    if (absence.status === "accepted") {
      return res.json({ message: "Replacement already approved" });
    }

    // נזהה אם מדובר במורה פנימי או ממלא מקום חיצוני לפי ת"ז
    let substitute = await User.findOne({ userId: identityNumber });
    let substituteType = "User";

    if (!substitute) {
      substitute = await ExternalSubstitute.findOne({ identityNumber });
      substituteType = "ExternalSubstitute";
    }

    if (!substitute) {
      return res.status(404).json({ message: "Substitute with this identity number not found" });
    }

    // עדכון השדות של הבקשה
    absence.substituteTeacher = substitute._id;
    absence.substituteModel = substituteType;
    absence.status = "accepted";
    absence.response = {
      firstName,
      lastName,
      identityNumber,
      email,
      notes
    };

    await absence.save();

    res.json({ message: "Replacement approved", absence });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


export const getSubstituteRequests = async (req, res) => {
  try {
    const requests = await SubstituteRequest.find()
      .populate('originalTeacherId', 'firstName lastName email')
      .populate('substituteTeacher', 'firstName lastName email'); // תיקון מ-substituteTeacherId

    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

