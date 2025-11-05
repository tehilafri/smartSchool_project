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
    const html = `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
        <h2>ברוך הבא למערכת smartSchool!</h2>
        
        <p>שלום ${user.firstName} ${user.lastName},</p>
        
        <p>הצטרפת בהצלחה למערכת בית הספר "${school.name}".</p>
        
        <h3>פרטי התחברות:</h3>
        <ul>
          <li><strong>שם משתמש:</strong> ${user.userName}</li>
          <li><strong>סיסמה:</strong> ${user.password}</li>
          <li><strong>קוד בית הספר:</strong> ${school.schoolCode}</li>
        </ul>
        
        <p>להתחברות למערכת:</p>
        <p><a href="${process.env.FRONTEND_URL}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">היכנס/י למערכת</a></p>
        
        <p>בברכה,<br>
        צוות smartSchool</p>
      </div>
    `;

    await sendEmail({ to: user.email, subject, html });
  } catch (err) {
    console.error("Failed to send welcome email:", err.message);
    // אפשר לבחור לא לזרוק הלאה כדי לא להפיל את כל יצירת המשתמש
  }
};
