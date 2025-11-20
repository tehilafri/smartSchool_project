import SubstituteRequest from '../models/SubstituteRequest.js';
import Class from '../models/Class.js';
import Schedule from '../models/Schedule.js';
import cron from "node-cron";
import { findCandidates } from '../services/SubstituteService.js';
import { sendEmail } from '../utils/email.js'; 
import { handleApproveReplacement } from "../services/SubstituteService.js";
import { readSheet, updateSheetCell, batchUpdate, markRowsProcessedByAbsenceCode } from "../utils/googleSheets.js";

const SHEET_ID = process.env.SHEET_ID;
const SHEET_TAB = process.env.SHEET_TAB_NAME || "Responses";
const SHEET_RANGE =`'${SHEET_TAB}'!A:Z`; // מספיק רחב כדי לכלול את העמודה החדשה 'התייחסו'

export const resetPastSubstitutes = async () => {// רץ כל שעה ומחזיר את הסטטוס של שיעורים שהיו מוחלפים אם התאריך והזמן עברו
  try {
    console.log('Starting resetPastSubstitutes job...');
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const schedules = await Schedule.find({
    $or: [
      { 'weekPlan.sunday.replacementDate': { $exists: true, $ne: null } },
      { 'weekPlan.monday.replacementDate': { $exists: true, $ne: null } },
      { 'weekPlan.tuesday.replacementDate': { $exists: true, $ne: null } },
      { 'weekPlan.wednesday.replacementDate': { $exists: true, $ne: null } },
      { 'weekPlan.thursday.replacementDate': { $exists: true, $ne: null } },
      { 'weekPlan.friday.replacementDate': { $exists: true, $ne: null } }
    ]
  });

    for (const schedule of schedules) {
      let updated = false;

      for (const [day, lessons] of Object.entries(schedule.weekPlan)) {
        for (const lesson of lessons) {
          if (lesson.replacementDate) {
            const lessonDateStr = lesson.replacementDate.toISOString().split('T')[0];

            const isPastDate = lessonDateStr < todayStr;
            const isTodayPastTime = lessonDateStr === todayStr && lesson.endTime <= currentTime;

            if (isPastDate || isTodayPastTime) {
              lesson.status = lesson.status === 'replaced' ? 'normal' : lesson.status;
              lesson.substitute = null;
              lesson.substituteModel = null;
              lesson.replacementDate = null;
              updated = true;
            }
          }
        }
      }

      if (updated) {
        await schedule.save();
      }
    }

  } catch (err) {
    console.error('Error in resetPastSubstitutes job:', err);
  }
};

const sendSubstituteEmail = async (teacher, request, formattedDate) => {
  // שליפת פרטים מלאים
  const fullRequest = await SubstituteRequest.findById(request._id)
    .populate('originalTeacherId')
    .populate('schoolId')
    .populate('classId');

  const className = fullRequest.classId?.name || 'Unknown Class';
  const schoolName = fullRequest.schoolId?.name || 'לא ידוע';
  const schoolAddress = fullRequest.schoolId?.address || 'לא ידוע';
  const schoolPhone = fullRequest.schoolId?.phone || 'לא ידוע';
  const originalTeacher = fullRequest.originalTeacherId;

  // Check for valid teacher email before sending
  if (!teacher.email) {
    console.warn(`No email defined for teacher: ${teacher.firstName} ${teacher.lastName} (ID: ${teacher._id})`);
    return;
  }

  await sendEmail({
    to: teacher.email,
    subject: `בקשת מילוי מקום - ${request.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
        <h2>שלום ${teacher.firstName},</h2>

        <p>אנחנו מחפשים מישהו למלא מקום בשיעור ${request.subject} לכיתה ${className}.</p>
        
        <h3>פרטי השיעור:</h3>
        <ul>
          <li><strong>תאריך:</strong> ${formattedDate}</li>
          <li><strong>שעות:</strong> ${request.startTime} - ${request.endTime}</li>
          <li><strong>מקצוע:</strong> ${request.subject}</li>
          <li><strong>כיתה:</strong> ${className}</li>
        </ul>
        
        <h3>פרטי בית הספר:</h3>
        <ul>
          <li><strong>שם:</strong> ${schoolName}</li>
          <li><strong>כתובת:</strong> ${schoolAddress}</li>
          <li><strong>טלפון:</strong> ${schoolPhone}</li>
        </ul>
        
        <h3>פרטי המורה המקורית:</h3>
        <ul>
          <li><strong>שם:</strong> ${originalTeacher?.firstName} ${originalTeacher?.lastName}</li>
          <li><strong>אימייל:</strong> ${originalTeacher?.email || 'לא ידוע'}</li>
          <li><strong>טלפון:</strong> ${originalTeacher?.phone || 'לא ידוע'}</li>
        </ul>
        
        <p>אם את/ה יכול/ה למלא מקום, אנא אשר/י על ידי מילוי הטופס כאן:</p>
        <p><a href="${request.formLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">מלא/י טופס</a></p>

        <p>תודה!</p>
      </div>
    `
  });

}

export const checkPendingSubstituteRequests = async () => {
  
  const now = new Date();
  const pendingRequests = await SubstituteRequest.find({ status: 'pending', checked: false });

  for (const request of pendingRequests) {
    const weekBefore = new Date(request.date);
    weekBefore.setDate(weekBefore.getDate() - 7);
   
    if (now > weekBefore) {
      const { availableInternal, availableExternal } = await findCandidates(request);

      
      // --- כאן שולחים מיילים בפועל ---
      const formattedDate = new Date(request.date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });

      for (const teacher of [...availableInternal, ...availableExternal]) {
        await sendSubstituteEmail(teacher, request, formattedDate);
      }

      request.checked = true;
      await request.save();
    }
  }
};

// יריץ כל 10 דקות (*/10 * * * *)
export function startCheckJob() {
  cron.schedule("*/1 * * * *", async () => {
    try {
      const rows = await readSheet(SHEET_ID, SHEET_RANGE);
      if (!rows || rows.length < 2) {
        return;
      }

      const header = rows[0].map(h => (h || "").toString());
      let processedColIndex = header.findIndex(h => /התייחסו|processed/i.test(h));
      if (processedColIndex === -1) {
        // הוספת כותרת עמודה אוטומטית (עמודה הבאה)
        processedColIndex = header.length;
        const colLetter = columnToLetter(processedColIndex + 1);
        await updateSheetCell(SHEET_ID, `${SHEET_TAB}!${colLetter}1`, "התייחסו");
      }

      const updates = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const sheetRowNumber = i + 1;
        const processedCell = row[processedColIndex];

        // העמודות לפי המבנה שלך
        const timestamp = row[0];
        const email = row[1];
        const idNumber = row[2];
        const phone = row[3];
        const notes = row[4];
        const absenceCode = row[5];
        const firstName = row[6];
        const lastName = row[7];

        if (!absenceCode) {
          // אין קוד → לא נמשיך
          const colLetter = columnToLetter(processedColIndex + 1);
          updates.push({ range: `${SHEET_TAB}!${colLetter}${sheetRowNumber}`, values: [["אין קוד"]] });
          continue;
        }

        const request = await SubstituteRequest.findOne({ absenceCode });
        if (!request) {
          const colLetter = columnToLetter(processedColIndex + 1);
          updates.push({ range: `${SHEET_TAB}!${colLetter}${sheetRowNumber}`, values: [["בקשה לא קיימת"]] });
          continue;
        }

        // אם הבקשה כבר אושרה → נסמן "טופל"
        if (request.status === "accepted") {
          const colLetter = columnToLetter(processedColIndex + 1);
          if (processedCell !== "טופל") {
            updates.push({ range: `${SHEET_TAB}!${colLetter}${sheetRowNumber}`, values: [["טופל"]] });
          }
          continue;
        }

        // אם כבר יש ערך אחר בעמודה (כמו "נשלח למורה") → לא נדרוס
        if (processedCell && processedCell.toString().trim() !== "") continue;

        // נעדכן את ה־DB עם פרטי התגובה
        request.response = { firstName, lastName, identityNumber: idNumber, email, notes, phone, timestamp };
        await request.save();

        // שליחת מייל למורה המקורית
        await request.populate("originalTeacherId");
        const teacherEmail = request.originalTeacherId?.email;
        if (teacherEmail) {
          const subject = `ממלא/ת מקום חדש/ה לבקשה: ${absenceCode}`;
          const appBase = process.env.VITE_API_URL || "http://localhost:3000";
          const approveUrl = `${appBase}/api/substitute-requests/approve-email/${absenceCode}?firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}&email=${encodeURIComponent(email || "")}&phone=${encodeURIComponent(phone || "")}&identityNumber=${encodeURIComponent(idNumber || "")}&notes=${encodeURIComponent(notes || "")}`;
          
          const html = `
          <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right;">
            <h2>שלום ${request.originalTeacherId.firstName} ${request.originalTeacherId.lastName},</h2>

            <p>נרשם מועמד/ת חדש/ה למלא מקום:</p>
            <ul>
              <li><strong>שם:</strong> ${firstName} ${lastName}</li>
              <li><strong>ת"ז:</strong> ${idNumber || "-"}</li>
              <li><strong>אימייל:</strong> ${email || "-"}</li>
              <li><strong>טלפון:</strong> ${phone || "-"}</li>
              <li><strong>הערות:</strong> ${notes || "-"}</li>
            </ul>
            <p><strong>קוד בקשה:</strong> ${absenceCode}</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${approveUrl}" style="background-color: #4CAF50; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer; border-radius: 4px;">אשר בקשה</a>
            </div>
            <p>המערכת, smartSchool.</p>
          </div>`;

          try {
            // Extra check for valid email
            if (!teacherEmail) {
              console.warn(`No email defined for original teacher (absenceCode: ${absenceCode})`);
            } else {
              await sendEmail({to: teacherEmail, subject, html});
              const colLetter = columnToLetter(processedColIndex + 1);
              updates.push({ range: `${SHEET_TAB}!${colLetter}${sheetRowNumber}`, values: [["נשלח למורה"]] });
            }
          } catch (e) {
            console.error("Failed to send notification email:", e);
            const colLetter = columnToLetter(processedColIndex + 1);
            updates.push({ range: `${SHEET_TAB}!${colLetter}${sheetRowNumber}`, values: [["שגיאת שליחה"]] });
          }
        } else {
          const colLetter = columnToLetter(processedColIndex + 1);
          updates.push({ range: `${SHEET_TAB}!${colLetter}${sheetRowNumber}`, values: [["אין אימייל למורה"]] });
        }
      } // end for

      if (updates.length) {
        await batchUpdate(SHEET_ID, updates);
      }
    } catch (err) {
      console.error("Error in check job:", err);
    }
  });
}


function columnToLetter(col) {
  let temp;
  let letter = "";
  while (col > 0) {
    temp = (col - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    col = Math.floor((col - temp - 1) / 26);
  }
  return letter;
}
