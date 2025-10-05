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
הצטרפת בהצלחה למערכת בית הספר.

שם המשתמש שלך הוא: ${user.userName}
הסיסמה שלך היא: ${user.password}
קוד בית הספר שלך הוא: ${school.schoolCode}
    `;

    await sendEmail(user.email, subject, text);
  } catch (err) {
    console.error("Failed to send welcome email:", err.message);
    // אפשר לבחור לא לזרוק הלאה כדי לא להפיל את כל יצירת המשתמש
  }
};
