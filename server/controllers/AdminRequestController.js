import AdminRequest from '../models/AdminRequest.js';
import User from '../models/User.js';
import School from '../models/School.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { sendEmail } from '../utils/email.js';
import { generateCode } from '../utils/generatedCode.js';

export const submitAdminRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log('Received admin request:', req.body);
    const { firstName, lastName, email, phone, birthDate, gender, userId } = req.body;

  // בדיקת כפילויות על פי תעודת זהות ואימייל
      const existingRequest = await AdminRequest.findOne({ 
      $or: [{ userId }, { email }] 
    }).session(session);

    if (existingRequest) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'בקשה עם תעודת זהות או אימייל זה כבר קיימת במערכת' });
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

    await adminRequest.save({ session });

    // שליחת מייל למנהל
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
      subject: 'בקשת מנהל/ת חדש/ה - Smart School',
      html: `
        <div dir="rtl">
          <h2>משתמש חדש בשם: ${firstName} ${lastName}</h2>
          <p>מעוניין ליצור בית ספר חדש במערכת.</p>
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

    // אם הכל עבר בהצלחה, commit לטרנזקציה
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: 'הבקשה נשלחה בהצלחה' });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error submitting admin request:', err);
    // אם זו שגיאת כפילות של MongoDB נחזיר הודעה ידידותית
    if (err && err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || 'field';
      return res.status(400).json({ message: `${field} כבר קיים במערכת` });
    }
    res.status(500).json({ message: 'שגיאה בשליחת הבקשה' });
  }
};

export const approveAdminRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { token } = req.params;

    // מציאת הבקשה
    const adminRequest = await AdminRequest.findOne({ approvalToken: token, status: 'pending' }).session(session);
    if (!adminRequest) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'בקשה לא נמצאה או כבר טופלה' });
    }

    // יצירת סיסמה זמנית
    const tempPassword = '12345678';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // יצירת קוד בית ספר זמני ייחודי
    const tempSchoolCode = `TEMP_${generateCode()}`;

    // יצירת בית ספר זמני
    const tempSchool = new School({
      name: `בית ספר זמני ${tempSchoolCode}`,
      schoolCode: tempSchoolCode,
      principalId: new mongoose.Types.ObjectId(), // זמני
      address: 'כתובת זמנית',
      phone: adminRequest.phone,
      email: process.env.EMAIL_USER,
      description: 'בית ספר זמני - יש לעדכן פרטים'
    });
    await tempSchool.save({ session });

    // יצירת משתמש מנהלת עם בית הספר
    const userName = `${adminRequest.firstName}${adminRequest.lastName}`;

    // בדיקה האם כבר יש משתמש בטבלת users עם אותה תעודת זהות (userId)
    // אם כן - נעדכן אותו ונקשר לבית הספר; אחרת ניצור משתמש חדש.
    const existingByUserId = await User.findOne({ userId: adminRequest.userId }).session(session);
    let newAdmin;
    if (existingByUserId) {
      existingByUserId.firstName = adminRequest.firstName;
      existingByUserId.lastName = adminRequest.lastName;
      existingByUserId.gender = adminRequest.gender;
      existingByUserId.email = adminRequest.email;
      existingByUserId.phone = adminRequest.phone;
      existingByUserId.birthDate = adminRequest.birthDate;
      existingByUserId.role = 'admin';
      existingByUserId.schoolId = tempSchool._id;
      existingByUserId.userName = userName;
      existingByUserId.password = hashedPassword;
      await existingByUserId.save({ session });
      newAdmin = existingByUserId;
    } else {
      // אין משתמש עם אותה ת"ז -> יצירת משתמש חדש (מותר אם יש כבר משתמשים אחרים עם אותו אימייל)
      newAdmin = new User({
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
      try {
        await newAdmin.save({ session });
      } catch (saveErr) {
        // במקרה שיש עדיין אינדקס ייחודי על email או חריגה אחרת - ננסה fallback:
        if (saveErr && saveErr.code === 11000 && saveErr.keyPattern && saveErr.keyPattern.email) {
          // יצירת אימייל זמני ע"י הוספת +TEMP<code> לפני ה-@
          const origEmail = adminRequest.email || '';
          if (origEmail.includes('@')) {
            const parts = origEmail.split('@');
            const fallbackEmail = `${parts[0]}+TEMP_${generateCode().slice(0,6)}@${parts[1]}`;
            newAdmin.email = fallbackEmail;
            console.warn('Duplicate email detected, using fallback email:', fallbackEmail);
            // נסיון שנית לשמור (אם עדיין כשל - נזרוק השגיאה המקורית)
            await newAdmin.save({ session });
          } else {
            // אימייל לא תקין - לזרוק את השגיאה המקורית
            throw saveErr;
          }
        } else {
          throw saveErr;
        }
      }
    }

    // עדכון בית הספר עם המנהלת האמיתית
    tempSchool.principalId = newAdmin._id;
    await tempSchool.save({ session });

    // עדכון סטטוס הבקשה
    adminRequest.status = 'approved';
    await adminRequest.save({ session });

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

    // אם הכל עבר בהצלחה, commit לטרנזקציה
    await session.commitTransaction();
    session.endSession();

    res.json({ message: 'הבקשה אושרה בהצלחה' });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error approving admin request:', err);

    if (err.name === 'ValidationError') {
      const errorMessages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: `שגיאות ולידציה: ${errorMessages.join(', ')}` });
    }

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ message: `${field} כבר קיים במערכת` });
    }

    res.status(500).json({ message: 'שגיאה באישור הבקשה' });
  }
};