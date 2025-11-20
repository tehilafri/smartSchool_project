import nodemailer from "nodemailer";
import { google } from "googleapis";

export const sendEmail = async (options) => {
  const { to, subject, text, html } = options;
  try {
    // יוצרים את ה‑OAuth2Client בתוך הפונקציה
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || "https://developers.google.com/oauthplayground"
    );

    // מגדירים את ה‑refresh token
    oAuth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    // שולפים את ה‑access token
    const at = await oAuth2Client.getAccessToken();
    const accessToken = typeof at === "string" ? at : at?.token;

    if (!accessToken) {
      throw new Error("Failed to get access token from OAuth2 client");
    }

    // יוצרים את ה‑transporter של nodemailer
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // חובה להיות false בפורט 587
      requireTLS: true, // מכריח הצפנה
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken, // הטוקן ששלפת
      },
    });

    // מגדירים את המייל
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html
    };

    // שולחים את המייל
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (err) {
    console.error("Error sending email:", err);
    throw err;
  }
};

