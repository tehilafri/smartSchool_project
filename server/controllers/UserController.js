import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Class from '../models/Class.js';
// --- Authentication ---

export const register = async (req, res) => {
  try {
    const { firstName, lastName, gender, userId, email, birthDate, password, role, classes, subjects, ishomeroom } = req.body;
    
    let validClasses = [];
    if (classes && classes.length > 0) {
      const existingClasses = await Class.find({ name: { $in: classes } });
      if (existingClasses.length !== classes.length) {
        const existingNames = existingClasses.map(c => c.name);
        const invalidNames = classes.filter(c => !existingNames.includes(c));
        return res.status(400).json({ message: `These classes do not exist: ${invalidNames.join(', ')}` });
      }
      validClasses = existingClasses.map(c => c._id);
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      firstName,
      lastName,
      userName: `${firstName}${lastName}`,
      gender,
      userId,
      email,
      birthDate,
      password: hashedPassword,
      role,
      classes: validClasses,
      subjects,
      ishomeroom
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { userName, password } = req.body;
    const user = await User.findOne({ userName });
    if (!user) return res.status(401).json({ message: 'Invalid credentials of user' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials of password' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Admin---

export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('-password');
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.id }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
