import AdminRequest from '../models/AdminRequest.js';
import User from '../models/User.js';
import School from '../models/School.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { sendEmail } from '../utils/email.js';
import { generateCode } from '../utils/generatedCode.js';

export const submitAdminRequest = async (req, res) => {
  try {
    console.log('Received admin request:', req.body);
    const { firstName, lastName, email, phone, birthDate, gender, userId } = req.body;

    // בדיקה אם כבר קיימת בקשה עם המייל או תעודת זהות
    const existingRequest = await AdminRequest.findOne({
      $or: [{ email }, { userId }]
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'בקשה עם פרטים אלה כבר קיימת במערכת' });
    }

    // יצירת טוקן אישור
    const approvalToken = generateCode();

    // יצירת בקשה חדשה
    const adminRequest = new AdminRequest({
      firstName,
      lastName,
      email,
      phone,
      birthDate,
      gender,
      userId,
      approvalToken
    });

    await adminRequest.save();

    // שליחת מייל למנהלת
    await sendEmail({
      to: email,
      subject: 'בקשתך נשלחה בהצלחה - Smart School',
      html: `
        <div dir="rtl">
          <h2>שלום ${firstName} ${lastName},</h2>
          <p>פרטיך נשלחו למערכת ונמצאים בבדיקה.</p>
          <p>תיענה בהקדם האפשרי.</p>
          <br>
          <p>בברכה,<br>צוות Smart School</p>
        </div>
      `
    });

    // שליחת מייל למערכת
    const approvalLink = `${process.env.FRONTEND_URL}/approve-admin/${approvalToken}`;
    await sendEmail({
      to: process.env.EMAIL_USER,
      subject: 'בקשת מנהלת חדשה - Smart School',
      html: `
        <div dir="rtl">
          <h2>מנהלת חדשה בשם: ${firstName} ${lastName}</h2>
          <p>מעוניינת ליצור בית ספר חדש.</p>
          <br>
          <p><strong>פרטים:</strong></p>
          <ul>
            <li>שם: ${firstName} ${lastName}</li>
            <li>אימייל: ${email}</li>
            <li>טלפון: ${phone}</li>
            <li>תעודת זהות: ${userId}</li>
            <li>תאריך לידה: ${new Date(birthDate).toLocaleDateString('he-IL')}</li>
          </ul>
          <br>
          <p><strong>האם לאשר?</strong></p>
          <a href="${approvalLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">אשר בקשה</a>
        </div>
      `
    });

    res.status(201).json({ message: 'הבקשה נשלחה בהצלחה' });
  } catch (err) {
    console.error('Error submitting admin request:', err);
    res.status(500).json({ message: 'שגיאה בשליחת הבקשה' });
  }
};

export const approveAdminRequest = async (req, res) => {
  try {
    const { token } = req.params;

    // מציאת הבקשה
    const adminRequest = await AdminRequest.findOne({ approvalToken: token, status: 'pending' });
    if (!adminRequest) {
      return res.status(404).json({ message: 'בקשה לא נמצאה או כבר טופלה' });
    }

    // יצירת סיסמה זמנית
    const tempPassword = '12345678';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // יצירת קוד בית ספר זמני ייחודי
    const tempSchoolCode = `TEMP_${generateCode()}`;

    // יצירת בית ספר זמני קודם
    const tempSchool = new School({
      name: 'בית ספר זמני',
      schoolCode: tempSchoolCode,
      principalId: new mongoose.Types.ObjectId(), // זמני
      address: 'כתובת זמנית',
      phone: adminRequest.phone,
      email: process.env.EMAIL_USER,
      description: 'בית ספר זמני - יש לעדכן פרטים'
    });
    await tempSchool.save();

    // יצירת משתמש מנהלת עם בית הספר
    const userName = `${adminRequest.firstName}${adminRequest.lastName}`;
    const newAdmin = new User({
      firstName: adminRequest.firstName,
      lastName: adminRequest.lastName,
      schoolId: tempSchool._id,
      userName,
      gender: adminRequest.gender,
      userId: adminRequest.userId,
      email: adminRequest.email,
      phone: adminRequest.phone,
      birthDate: adminRequest.birthDate,
      password: hashedPassword,
      role: 'admin'
    });
    await newAdmin.save();

    // עדכון בית הספר עם המנהלת האמיתית
    tempSchool.principalId = newAdmin._id;
    await tempSchool.save();

    // עדכון סטטוס הבקשה
    adminRequest.status = 'approved';
    await adminRequest.save();

    // שליחת מייל אישור למנהלת
    await sendEmail({
      to: adminRequest.email,
      subject: 'אושרת להתחבר למערכת - Smart School',
      html: `
        <div dir="rtl">
          <h2>שלום ${adminRequest.firstName} ${adminRequest.lastName},</h2>
          <p><strong>אושרת להתחבר למערכת!</strong></p>
          <br>
          <p><strong>פרטי התחברות:</strong></p>
          <ul>
            <li>שם משתמש: ${userName}</li>
            <li>סיסמה זמנית: ${tempPassword}</li>
            <li>קוד בית ספר זמני: ${tempSchoolCode}</li>
          </ul>
          <br>
          <p><strong>הוראות:</strong></p>
          <ol>
            <li>דבר ראשון התחבר למערכת עם הפרטים לעיל</li>
            <li>לאחר מכן רשום את בית הספר שלך במערכת</li>
            <li>שנה את הסיסמה באמצעות "שכחתי סיסמה"</li>
          </ol>
          <br>
          <p>לאחר רישום בית הספר תקבל קוד חדש לבית הספר.</p>
          <br>
          <p>בברכה,<br>צוות Smart School</p>
        </div>
      `
    });

    res.json({ message: 'הבקשה אושרה בהצלחה' });
  } catch (err) {
    console.error('Error approving admin request:', err);
    res.status(500).json({ message: 'שגיאה באישור הבקשה' });
  }
};