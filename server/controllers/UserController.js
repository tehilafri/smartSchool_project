import User from '../models/User.js';
import School from '../models/School.js';
import Class from '../models/Class.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {sendEmail} from '../utils/email.js';
import { sendWelcomeEmail } from '../services/UserService.js';

export const register = async (req, res) => {
  try {
    const { firstName, lastName, gender, userId, email, phone, birthDate, password, role, classes, subjects, ishomeroom } = req.body;

    // לבדוק מי המשתמש שמבצע את הבקשה
    const currentUser = await User.findById(req.id);
    if (!currentUser) {
      return res.status(403).json({ message: 'Unauthorized: user not found' });
    }

    // אם המשתמש הוא secretary והוא מנסה ליצור secretary אחר – אסור
    if (currentUser.role === 'secretary' && role === 'secretary') {
      return res.status(403).json({ message: 'Secretaries cannot create other secretaries' });
    }

    // בדיקת כיתות שהוזנו
    let validClasses = [];
    if (classes && classes.length > 0) {
      const existingClasses = await Class.find({ name: { $in: classes }, schoolId: req.schoolId });
      if (existingClasses.length !== classes.length) {
        const existingNames = existingClasses.map(c => c.name);
        const invalidNames = classes.filter(c => !existingNames.includes(c));
        return res.status(400).json({ message: `These classes do not exist: ${invalidNames.join(', ')}` });
      }
      validClasses = existingClasses.map(c => c._id);
    }

    // בדיקות ייחודיות בהתאם ל-role
    let existingUser = null;
    if (['teacher', 'secretary'].includes(role)) {
      existingUser = await User.findOne({
        $or: [
          { userId, schoolId: req.schoolId },
          { email, schoolId: req.schoolId }
        ]
      });
    } else if (['student', 'admin'].includes(role)) {
      existingUser = await User.findOne({
        $or: [{ userId }, { email }]
      });
    }

    if (existingUser) {
      return res.status(400).json({ message: 'User with this ID or email already exists' });
    }

    // שמירה זמנית של הסיסמה המקורית
    const plainPassword = password;

    // הצפנת סיסמה
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      firstName,
      lastName,
      schoolId: req.schoolId,
      userName: `${firstName}${lastName}`,
      gender,
      userId,
      email,
      phone,
      birthDate,
      password: hashedPassword,
      role,
      classes: validClasses,
      subjects,
      ishomeroom
    });

    await newUser.save();

    // אם תלמיד – לעדכן את הכיתה
    if (role === 'student' && validClasses.length > 0) {
      for (const classId of validClasses) {
        const classDoc = await Class.findById(classId);
        if (classDoc && !classDoc.students.includes(newUser._id)) {
          classDoc.students.push(newUser._id);
          await classDoc.save();
        }
      }
    }
    sendWelcomeEmail({
  ...newUser.toObject(), // המרת המסמך לאובייקט רגיל
  password: plainPassword // החלפה בסיסמה המקורית לצורך שליחת המייל בלבד
});

    res.status(201).json({ message: 'User registered successfully' });

  } catch (err) {
    console.error(err);

    // אם זו שגיאת כפילות של MongoDB
    if (err.code === 11000) {
        const duplicateField = Object.keys(err.keyValue)[0]; // שדה שחזר כפול
        const duplicateValue = err.keyValue[duplicateField];
        return res.status(400).json({
            message: `משתמש עם אותו ${duplicateField === 'userName' ? 'שם משתמש' : duplicateField === 'userId' ? 'תעודת זהות' : 'מייל'} כבר קיים בבית הספר`
        });
    }

    res.status(500).json({ message: 'Server error', error: err.message });
}
};

export const login = async (req, res) => {
  try {
    const { userName, password, schoolCode } = req.body;
    console.log('Login attempt:', { userName, schoolCode, hasPassword: !!password });

    // שליפת בית ספר לפי קוד
    const school = await School.findOne({ schoolCode });
    if (!school) {
      console.log('School not found:', schoolCode);
      return res.status(401).json({ message: 'Invalid school code' });
    }
    console.log('School found:', school.name);

    // מציאת המשתמש לפי userName ושיוך לבית ספר
    const user = await User.findOne({ userName, schoolId: school._id });
    if (!user) {
      console.log('User not found:', userName);
      return res.status(401).json({ message: 'Invalid credentials of user' });
    }
    console.log('User found:', user.email);
    console.log('User schoolId:', user.schoolId);
    console.log('School _id:', school._id);
    console.log('School IDs match:', user.schoolId.toString() === school._id.toString());

    // בדיקת סיסמה
    console.log('Comparing password:', password);
    console.log('Stored hash length:', user.password.length);
    console.log('Stored hash starts with:', user.password.substring(0, 10));
    
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    
    // בדיקה ידנית עם הסיסמה הבסיסית
    const basicMatch = await bcrypt.compare('12345678', user.password);
    console.log('Basic password (12345678) match:', basicMatch);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials of password' });
    }

    // יצירת JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, schoolId: school._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Login successful for:', user.email);
    res.json({
      token,
      user: {
        id: user._id,
        userName: user.userName,
        role: user.role,
        schoolCode: school.schoolCode,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// export const login = async (req, res) => {
//   try {
//     const { userName, password } = req.body;

//     // // שליפת בית ספר לפי קוד
//     // const school = await School.findOne({ schoolCode });
//     // if (!school) {
//     //   return res.status(401).json({ message: 'Invalid school code' });
//     // }

//     // מציאת המשתמש לפי userName
//     const user = await User.findOne({ userName });
//     if (!user) {
//       return res.status(401).json({ message: 'Invalid credentials of user' });
//     }

//     // בדיקת סיסמה
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: 'Invalid credentials of password' });
//     }

//     // יצירת JWT
//     const token = jwt.sign(
//       { id: user._id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: '1h' }
//     );

//     res.json({
//       token,
//       user: {
//         id: user._id,
//         userName: user.userName,
//         role: user.role
//       }
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

export const getMe = async (req, res) => {
  try {
    const userId = req.id;

    const user = await User.findById(userId)
      .select("-password")
      .populate({
        path: "classes",
        select: "name homeroomTeacher", // שדות שאת רוצה להחזיר
        populate: { path: "homeroomTeacher", select: "firstName lastName" } 
      })
      .populate({
        path: "schoolId", 
        select: "_id name scheduleHours address phone email description website schoolCode" // שדות שרוצים להחזיר
      });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher', schoolId: req.schoolId }).select('-password').populate('classes', 'name');
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student', schoolId: req.schoolId }).select('-password').populate('classes', 'name');
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllSecretaries = async (req, res) => {
  try {
    const secretaries = await User.find({ role: 'secretary', schoolId: req.schoolId }).select('-password');
    res.json(secretaries);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id, { schoolId: req.schoolId }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { firstName, lastName,password, email,phone, birthDate, classes, subjects, ishomeroom } = req.body;

    // המשתמש שמבצע את הבקשה
    const currentUser = await User.findById(req.id);
    if (!currentUser) return res.status(403).json({ message: 'Unauthorized: user not found' });

    const user = await User.findOne({ _id: req.params.id, schoolId: req.schoolId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // בדיקות הרשאות
    if (currentUser.role === 'student' || currentUser.role === 'teacher') {
      if (currentUser._id.toString() !== user._id.toString()) {
        return res.status(403).json({ message: 'You can only update your own profile' });
      }
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
    if (phone) user.phone = phone;
    if (birthDate) user.birthDate = birthDate;
    if (typeof ishomeroom !== 'undefined' && (currentUser.role === 'secretary' || currentUser.role === 'admin')) {
      user.ishomeroom = ishomeroom;
    }

  // עדכון כיתות
    if (classes) {
      // שליפה של כל הכיתות שהוזנו
      const existingClasses = await Class.find({ name: { $in: classes }, schoolId: req.schoolId });
      const existingNames = existingClasses.map(c => c.name);
      const invalidNames = classes.filter(c => !existingNames.includes(c));
      if (invalidNames.length > 0) {
        return res.status(400).json({ message: `These classes do not exist: ${invalidNames.join(', ')}` });
      }

      // בדיקת הרשאות לעדכון
      const canUpdateClasses =
        currentUser.role === 'admin' ||
        currentUser.role === 'secretary' ||
        (currentUser.role === 'teacher' && currentUser._id.toString() === user._id.toString());

      if (!canUpdateClasses) return res.status(403).json({ message: 'You cannot update classes for this user' });

      // שמירת הרשימה החדשה
      const newClassIds = existingClasses.map(c => c._id.toString());
      const oldClassIds = user.classes.map(c => c.toString());
      user.classes = existingClasses.map(c => c._id);

      // עדכון השדה לפי תפקיד
      const field = user.role === 'teacher' ? 'teachers' : 'students';

      // הוספה בכיתות החדשות
      for (const classDoc of existingClasses) {
        if (!classDoc[field].map(id => id.toString()).includes(user._id.toString())) {
          classDoc[field].push(user._id);
          await classDoc.save();
        }
      }

      // הסרה מהכיתות הישנות (רק מכיתות שלא קיימות ברשימה החדשה)
      const removedClassIds = oldClassIds.filter(id => !newClassIds.includes(id));
      if (removedClassIds.length > 0) {
        const removedClasses = await Class.find({ _id: { $in: removedClassIds } });
        for (const classDoc of removedClasses) {
          classDoc[field] = classDoc[field].filter(id => id.toString() !== user._id.toString());
          await classDoc.save();
        }
      }
    }


    // עדכון מקצועות (strings)
    if (subjects && (currentUser.role === 'secretary' || currentUser.role === 'teacher' || currentUser.role === 'admin')) {
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
  try {
    const { email, userId } = req.body;

    if (!email || !userId) {
      return res.status(400).json({ message: 'Email and User ID are required' });
    }

    // 1. לבדוק אם משתמש עם המייל ותעודת זהות קיים
    const user = await User.findOne({ email, userId });
    console.log('Looking for user with email:', email, 'and userId:', userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email and ID' });
    }
    
    console.log('User found:', user.email, 'from school:', user.schoolId);

    // 2. ליצור טוקן
    const resetToken = user.getResetPasswordToken();

    // 3. לשמור את הטוקן וה‑expire במסד
    await user.save({ validateBeforeSave: false });

    // 4. ליצור לינק לשחזור סיסמה
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset',
        html: `<p>You requested a password reset. Click here: <a href="${resetUrl}">Reset Password</a></p>`
      });

      res.status(200).json({ message: 'Email sent' });
    } catch (err) {
      console.error('Email sending error:', err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    console.log('Reset password request:', {
      token: req.params.token,
      hasPassword: !!req.body.password
    });

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    console.log('Looking for user with token:', resetPasswordToken);

    // חיפוש משתמש עם הטוקן (גם אם פג תוקף)
    let user = await User.findOne({ resetPasswordToken });
    
    if (!user) {
      console.log('User not found with token');
      return res.status(400).json({ message: 'Invalid token' });
    }
    
    // בדיקת תוקף הטוקן
    if (user.resetPasswordExpire && user.resetPasswordExpire < Date.now()) {
      console.log('Token expired for user:', user.email);
      // מחיקת הטוקן הפג תוקף
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ message: 'Token expired. Please request a new password reset.' });
    }

    console.log('User found:', user.email);
    console.log('User school ID:', user.schoolId);
    console.log('New password will be:', req.body.password);

    if (!req.body.password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // הצפנת הסיסמה החדשה
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    
    console.log('Password hashed successfully');
    console.log('New hash starts with:', hashedPassword.substring(0, 10));

    // עדכון הסיסמה ומחיקת הטוקן
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });
    console.log('User saved successfully');

    // שליחת מייל אישור
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Successful',
        html: `<p>Hello ${user.firstName},</p><p>Your password has been successfully reset.</p>`
      });
      console.log('Confirmation email sent');
    } catch (err) {
      console.error('Error sending confirmation email:', err);
    }

    res.status(200).json({ message: 'Password reset successful. A confirmation email has been sent.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// פונקציה לאיפוס סיסמה ידני למנהלת
export const resetAdminPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const admin = await User.findOne({ email, role: 'admin' });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash('12345678', salt);
    await admin.save();
    
    console.log('Admin password reset manually for:', email);
    res.json({ message: 'Password reset to 12345678' });
  } catch (err) {
    console.error('Manual password reset error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userIdToDelete = req.params.id;
    const userToDelete = await User.findById(userIdToDelete);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }
    // אם המנהל מנסה למחוק את עצמו
    if (req.id === userIdToDelete) {
      return res.status(400).json({ message: 'Admins cannot delete themselves' });
    }
    // אם המנהלת מנסה למחוק מנהלת אחרת
    if (req.role === 'secretary' && userToDelete.role === 'secretary') {
      return res.status(403).json({ message: 'Secretaries cannot delete other secretaries' });
    }
    // מחיקת המשתמש
    await User.findByIdAndDelete(userIdToDelete);
    // הסרת המשתמש מכל הכיתות בהן הוא רשום
    await Class.updateMany(
      { students: userIdToDelete },
      { $pull: { students: userIdToDelete } }
    );
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};