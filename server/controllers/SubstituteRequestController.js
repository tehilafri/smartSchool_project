import mongoose from 'mongoose';
import SubstituteRequest from '../models/SubstituteRequest.js';
import { handleTeacherAbsences, handleApproveReplacement } from '../services/SubstituteService.js';

export const reportAbsence = async (req, res) => {
  try {
    const { date, startTime, endTime, reason } = req.body;

    const absenceCodes = await handleTeacherAbsences({
      teacherId: req.id,
      date,
      startTime,
      endTime,
      reason
    });

    res.status(201).json({ message: 'Absence reported successfully', codes: absenceCodes });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

export const approveReplacement = async (req, res) => {
  try {
    const { absenceCode, firstName, lastName, email, notes, identityNumber } = req.body;

    const result = await handleApproveReplacement({
      absenceCode,
      approverId: req.id,
      firstName,
      lastName,
      email,
      notes,
      identityNumber
    }, req.schoolId);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

export const getSubstituteRequests = async (req, res) => {
  try {
    let filter = { schoolId: req.schoolId };

    // אם המשתמש הוא מורה → סינון לפי המורה המחובר
    if (req.role === 'teacher') {
      filter.originalTeacherId = req.id;
    }

    // אם המשתמש מנהלת → אין צורך להוסיף סינון נוסף (היא רואה את כולם)

    const requests = await SubstituteRequest.find(filter)
      .populate('originalTeacherId', 'firstName lastName email')
      .populate('substituteTeacher', 'firstName lastName email');

    res.json({ requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


