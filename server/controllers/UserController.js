import User from '../models/User.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Class from '../models/Class.js';
import {sendEmail} from '../utils/email.js';

export const register = async (req, res) => {
  try {
    const { firstName, lastName, gender, userId, email, birthDate, password, role, classes, subjects, ishomeroom } = req.body;

    // לבדוק מי המשתמש שמבצע את הבקשה
    const currentUser = await User.findById(req.id);
    if (!currentUser) {
      return res.status(403).json({ message: 'Unauthorized: user not found' });
    }

    // אם המשתמש הוא secretary והוא מנסה ליצור secretary אחר – אסור
    if (currentUser.role === 'secretary' && role === 'secretary') {
      return res.status(403).json({ message: 'Secretaries cannot create other secretaries' });
    }

    // בדיקת הכיתות שהוזנו
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

    // הצפנת סיסמה
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
    res.json({ token, user: { id: user._id, username: user.userName, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

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

export const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, birthDate, role, classes, subjects, ishomeroom, password } = req.body;

    // המשתמש שמבצע את הבקשה
    const currentUser = await User.findById(req.id);
    if (!currentUser) return res.status(403).json({ message: 'Unauthorized: user not found' });

    // המשתמש שמנסים לעדכן
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // בדיקות הרשאות
    if (currentUser.role === 'student' || currentUser.role === 'teacher') {
      if (currentUser._id.toString() !== user._id.toString()) {
        return res.status(403).json({ message: 'You can only update your own profile' });
      }
      if (role) return res.status(403).json({ message: 'You cannot change your role' });
    }

    if (currentUser.role === 'secretary') {
      if (user.role === 'secretary' && currentUser._id.toString() !== user._id.toString()) {
        return res.status(403).json({ message: 'Secretaries cannot update other secretaries' });
      }
    }

    // עדכון שדות בסיסיים
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (birthDate) user.birthDate = birthDate;
    if (role && currentUser.role === 'admin') user.role = role;
    if (typeof ishomeroom !== 'undefined' && (currentUser.role === 'secretary' || currentUser.role === 'admin')) {
      user.ishomeroom = ishomeroom;
    }

    // עדכון כיתות
    if (classes) {
      const existingClasses = await Class.find({ name: { $in: classes } });
      const existingNames = existingClasses.map(c => c.name);
      const invalidNames = classes.filter(c => !existingNames.includes(c));
      if (invalidNames.length > 0) {
        return res.status(400).json({ message: `These classes do not exist: ${invalidNames.join(', ')}` });
      }

      if (
        currentUser.role === 'admin' ||
        currentUser.role === 'secretary' ||
        (currentUser.role === 'teacher' && currentUser._id.toString() === user._id.toString())
      ) {
        user.classes = existingClasses.map(c => c._id);
      }
    }
    console.log(user.classes);
    
    // עדכון מקצועות (strings)
    if (subjects && (currentUser.role === 'secretary' || currentUser.role === 'admin')) {
      user.subjects = subjects;
    }

    // עדכון סיסמה
    if (password && (currentUser._id.toString() === user._id.toString() || currentUser.role === 'admin')) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    res.json({ message: 'User updated successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  // 1. לבדוק אם משתמש עם המייל הזה קיים
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'User not found with this email' });
  }

  // 2. ליצור טוקן
  const resetToken = user.getResetPasswordToken();

  // 3. לשמור את הטוקן וה‑expire במסד
  await user.save({ validateBeforeSave: false });

  // 4. ליצור לינק לשחזור סיסמה
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const message = `You requested a password reset. Click here: ${resetUrl}`;
  console.log(user.email);
  try {
    await sendEmail(user.email, 'Password Reset', message);

    res.status(200).json({ message: 'Email sent' });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(500).json({ message: 'Email could not be sent' });
  }
};

export const resetPassword = async (req, res) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(req.body.password, salt);

  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  // שליחת מייל אישור
  try {
    await sendEmail(
       user.email,
       'Password Reset Successful',
       `Hello ${user.firstName},\n\nYour password has been successfully reset.`
    );
  } catch (err) {
    console.error('Error sending confirmation email:', err);
  }

  res.status(200).json({ message: 'Password reset successful. A confirmation email has been sent.' });
};
