import MailingList from '../models/MailingList.js';
import { sendEmail } from '../utils/email.js';

export const addToMailingList = async (email, source = 'user', userId = null) => {
  try {
    await MailingList.findOneAndUpdate(
      { email },
      { email, source, userId, isActive: true },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('Error adding to mailing list:', err);
  }
};

export const subscribeToNewsletter = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    await addToMailingList(email, 'footer_signup');
    
    // שליחת מייל ברוכים הבאים
    try {
      await sendEmail({
        to: email,
        subject: 'ברוכים הבאים ל-Smart School!',
        html: `
          <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #007bff; color: white; padding: 20px; text-align: center;">
              <h1>Smart School</h1>
            </div>
            <div style="padding: 30px; background-color: #f8f9fa;">
              <h2>שלום ${email}!</h2>
              <p style="font-size: 16px; line-height: 1.6;">
                תודה שנרשמת לרשימת התפוצה של Smart School!
              </p>
              <p style="font-size: 16px; line-height: 1.6;">
                <strong>במה נוכל לעזור?</strong>
              </p>
              <ul style="font-size: 14px; line-height: 1.6;">
                <li>ניהול מערכת בית ספר מתקדמת וחכמה</li>
                <li>מערכת שעות דיגיטלית וקלה לשימוש</li>
                <li>ניהול מבחנים ואירועים</li>
                <li>מערכת היעדרויות וממלאי מקום</li>
                <li>דשבורדים מתקדמים לכל סוגי המשתמשים</li>
              </ul>
              <p style="font-size: 16px; line-height: 1.6;">
                אנו כאן כדי לעזור לך להפוך את בית הספר שלך לחכם ומתקדם יותר!
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}" 
                   style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  בקר באתר שלנו
                </a>
              </div>
            </div>
            <div style="background-color: #343a40; color: white; padding: 20px; text-align: center; font-size: 12px;">
              <p>צוות Smart School | smartschoolnotifications@gmail.com</p>
            </div>
          </div>
        `
      });
    } catch (emailErr) {
      console.error('Error sending welcome email:', emailErr);
      // לא נכשיל את ההרשמה אם המייל לא נשלח
    }
    
    res.status(200).json({ message: 'נרשמת בהצלחה לרשימת התפוצה!' });
  } catch (err) {
    console.error('Newsletter subscription error:', err);
    res.status(500).json({ message: 'שגיאה בהרשמה לרשימת התפוצה' });
  }
};

export const getAllEmails = async () => {
  try {
    const emails = await MailingList.find({ isActive: true }).select('email');
    return emails.map(item => item.email);
  } catch (err) {
    console.error('Error getting mailing list:', err);
    return [];
  }
};