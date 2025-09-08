import mongoose from 'mongoose';
import SubstituteRequest from '../models/SubstituteRequest.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/email.js';
import { generateCode } from '../utils/generatedCode.js';
import Class from '../models/Class.js';
import ExternalSubstitute from '../models/ExternalSubstitute.js';
import { handleReportAbsence, handleApproveReplacement } from '../services/SubstituteService.js';

export const reportAbsence = async (req, res) => {
  try {
    const { date, startTime, endTime, subject, className, reason } = req.body;

    const absenceCode = await handleReportAbsence({
      teacherId: req.id,
      date,
      startTime,
      endTime,
      subject,
      className,
      reason
    });

    res.status(201).json({ message: 'Absence reported successfully', code: absenceCode });
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
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
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

