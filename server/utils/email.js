import nodemailer from 'nodemailer';

// יוצרים transporter עם SMTP (למשל Gmail או שרת אחר)
const transporter = nodemailer.createTransport({
  service: 'Gmail', // אפשר לשים SMTP אחר אם רוצים
  auth: {
    user: process.env.EMAIL_USER, // המייל שלך מה-.env
    pass: process.env.EMAIL_PASS  // הסיסמא/אפליקציה סיסמה מה-.env
  }
});

/**
 * שולח מייל
 * @param {string} to - למי נשלח
 * @param {string} subject - נושא המייל
 * @param {string} text - תוכן המייל
 */
export const sendEmail = async (to, subject, text) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return info;
  } catch (err) {
    console.error('Error sending email:', err);
    throw err;
  }
};
