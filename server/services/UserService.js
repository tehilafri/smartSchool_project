import { sendEmail } from "../utils/email.js"; // הנתיב לפי איך שהגדרת
import School from "../models/School.js";

/**
 * שולח מייל ברוך הבא למשתמש חדש
 * @param {Object} user - אובייקט המשתמש שנוצר
 */
export const sendWelcomeEmail = async (user) => {
  try {
    // שולפים את בית הספר של המשתמש
    const school = await School.findById(user.schoolId);
    if (!school) {
      throw new Error("School not found for user");
    }

    const subject = "ברוך הבא למערכת בית הספר";
    const text = `
שלום ${user.firstName} ${user.lastName},

הצטרפת בהצלחה למערכת בית הספר "${school.name}".

פרטי ההתחברות שלך:
שם משתמש: ${user.userName}
סיסמה: ${user.password}
קוד בית הספר: ${school.schoolCode}

להתחברות למערכת היכנסי לכתובת:
${process.env.FRONTEND_URL}

בברכה,
צוות בית הספר
`;


    await sendEmail(user.email, subject, text);
  } catch (err) {
    console.error("Failed to send welcome email:", err.message);
    // אפשר לבחור לא לזרוק הלאה כדי לא להפיל את כל יצירת המשתמש
  }
};
