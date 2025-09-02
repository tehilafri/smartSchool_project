import SubstituteRequest from '../models/SubstituteRequest.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/email.js';

export const reportAbsence = async (req, res) => {
  try {
    const {date, startTime, endTime,subject, classId, reason } = req.body;
    const teacher = await User.findById(req.id);

    const absence = new SubstituteRequest({
      originalTeacherId: teacher.userId,
      date,
      startTime,
      endTime,
      subject,
      classId,
      reason,
      status: 'pending'
    });

    await absence.save();
    res.status(201).json({ message: 'Absence reported', absence });
  } catch (err) {
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

