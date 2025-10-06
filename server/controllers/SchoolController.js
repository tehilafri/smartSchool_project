import School from '../models/School.js';
import User from '../models/User.js';
import { generateCode } from '../utils/generatedCode.js';
import path from 'path';

export const createSchool = async (req, res) => {
  try {
    let { name, principalId, address, phone, email, website, description, scheduleHours } = req.body;

    // פענוח scheduleHours אם הוא string (מגיע מ-FormData)
    if (typeof scheduleHours === "string") {
      try {
        scheduleHours = JSON.parse(scheduleHours);
      } catch (e) {
        scheduleHours = [];
      }
    }

    // מאתרים את המנהלת לפי ת"ז
    const admin = await User.findOne({ userId: principalId, role: 'admin' });
    if (!admin) {
      return res.status(404).json({ message: 'Admin with this ID not found' });
    }

    const schoolCode = generateCode();

    // טיפול בתמונה
    let imageUrl = '';
    if (req.file) {
    // בונה URL מלא על בסיס הבקשה בפועל
    const protocol = req.protocol; // ייתן 'http'
    const host = req.get('host');  // ייתן 'localhost:1000'
    imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    } 

    // יצירת בית ספר
    const school = new School({
      name,
      schoolCode: schoolCode,
      principalId: admin._id,
      address,
      phone,
      email,
      website,
      description,
      imageUrl,
      schoolCode,
      scheduleHours: scheduleHours || []
    });

    await school.save();

    // עדכון המנהלת לשיוך לבית ספר
    admin.schoolId = school._id;
    await admin.save();

    res.status(201).json({
      message: 'School created successfully',
      school: {
        id: school._id,
        name: school.name,
        schoolCode: school.schoolCode,
        imageUrl: school.imageUrl
      }
    });
  } catch (err) {
    console.error('שגיאה ביצירת בית ספר:', err);
    res.status(400).json({ message: err.message });
  }
};

export const getSchoolById = async (req, res) => {
  try {
    const { id } = req.params;
    const school = await School.findOne({ schoolCode: id });
    if (!school) return res.status(404).json({ message: 'School not found' });
    if (school && school.imageUrl && school.imageUrl.startsWith('/uploads/')) {
      school.imageUrl = `${req.protocol}://${req.get('host')}${school.imageUrl}`;
    }

    res.json(school);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

export const updateSchool = async (req, res) => {
  try {
    const schoolId = req.schoolId;
    const { id } = req.params;

    if (schoolId !== id) {
      return res.status(403).json({ message: 'Access denied: unauthorized school' });
    }

    const updates = req.body;

    const school = await School.findById(id);
    if (!school) return res.status(404).json({ message: 'School not found' });

    // עדכון השדות מהבקשה
    Object.assign(school, updates);

    // שמירה - כאן pre('save') ירוץ וימלא את number ב-scheduleHours
    await school.save();

    res.json({ message: 'School updated successfully', school });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

export const deleteSchool = async (req, res) => {
  try {
    const { schoolId } = req.user;
    const { id } = req.params;

    if (schoolId !== id) {
      return res.status(403).json({ message: 'Access denied: unauthorized school' });
    }

    const school = await School.findByIdAndDelete(id);
    if (!school) return res.status(404).json({ message: 'School not found' });

    res.json({ message: 'School deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};
