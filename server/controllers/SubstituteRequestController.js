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
    const { absenceCode, firstName, lastName, email, notes, identityNumber ,phone} = req.body;

    const result = await handleApproveReplacement({
      absenceCode,
      approverId: req.id,
      firstName,
      lastName,
      email,
      notes,
      identityNumber,
      phone
    }, req.schoolId);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

export const approveReplacementByEmail = async (req, res) => {
  try {
    console.log('👏approveReplacementByEmail called with params:', req.params, 'and query:', req.query);
    const { absenceCode } = req.params;
    const { firstName, lastName, email, notes, identityNumber, phone } = req.query;

    const absence = await SubstituteRequest.findOne({ absenceCode });
    if (!absence) {
      return res.status(404).send('<h3>בקשה לא נמצאה</h3>');
    }

    const result = await handleApproveReplacement({
      absenceCode,
      approverId: absence.originalTeacherId.toString(),
      firstName,
      lastName,
      email,
      notes,
      identityNumber,
      phone
    }, absence.schoolId);

    const dashboardUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${dashboardUrl}/dashboard/teacher?message=approved&type=success`);
  } catch (err) {
    console.error(err);
    const dashboardUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${dashboardUrl}/dashboard/teacher?message=${encodeURIComponent(err.message)}&type=error`);
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


