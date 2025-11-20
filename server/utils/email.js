import { google } from "googleapis";
import nodemailer from "nodemailer"; // נשאר רק בשביל יצירת MIME, לא בשביל SMTP
import MailComposer from "nodemailer/lib/mail-composer/index.js";

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oAuth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    // נבנה MIME באמצעות nodemailer (לא שולחים דרכו)
    const mail = new MailComposer({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
      text,
    });

    const mimeMessage = await mail.compile().build();

    // המרה ל־base64 תקין לפי דרישות Google
    const encodedMessage = Buffer
      .from(mimeMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // שליחה לגוגל API
    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    return response.data;

  } catch (err) {
    console.error("Error sending email via Gmail API:", err);
    throw err;
  }
};
