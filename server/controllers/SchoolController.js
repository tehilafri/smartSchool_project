import School from '../models/School.js';
import User from '../models/User.js';
import { generateCode } from '../utils/generatedCode.js';

export const createSchool = async (req, res) => {
  try {
    const { name, principalId, address, phone, email, website, description, scheduleHours } = req.body;

    // מאתרים את המנהלת לפי ת"ז
    const admin = await User.findOne({ userId: principalId, role: 'admin' });
    if (!admin) {
      return res.status(404).json({ message: 'Admin with this ID not found' });
    }

    const schoolCode = generateCode(); //random code- the user must know it when accessing the web
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
        schoolCode: school.schoolCode, // קוד אנושי להמשך שימוש
      }
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

export const getSchoolById = async (req, res) => {
  try {
    const { schoolId } = req.user; // מה־JWT
    const { id } = req.params;

    if (schoolId !== id) {
      return res.status(403).json({ message: 'Access denied: unauthorized school' });
    }

    const school = await School.findById(id).populate('admin', 'firstName lastName email');
    if (!school) return res.status(404).json({ message: 'School not found' });

    res.json(school);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

export const updateSchool = async (req, res) => {
  try {
    const { schoolId } = req.user;
    const { id } = req.params;

    if (schoolId !== id) {
      return res.status(403).json({ message: 'Access denied: unauthorized school' });
    }

    const updates = req.body;
    const school = await School.findByIdAndUpdate(id, updates, { new: true });

    if (!school) return res.status(404).json({ message: 'School not found' });

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
