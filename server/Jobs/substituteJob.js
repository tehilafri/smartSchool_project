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
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const schedules = await Schedule.find({
      $or: [
        { 'weekPlan.sunday.status': 'replaced' },
        { 'weekPlan.monday.status': 'replaced' },
        { 'weekPlan.tuesday.status': 'replaced' },
        { 'weekPlan.wednesday.status': 'replaced' },
        { 'weekPlan.thursday.status': 'replaced' },
        { 'weekPlan.friday.status': 'replaced' }
      ]
    });

    for (const schedule of schedules) {
      let updated = false;

      for (const [day, lessons] of Object.entries(schedule.weekPlan)) {
        for (const lesson of lessons) {
          if (lesson.status === 'replaced' && lesson.replacementDate) {
            const lessonDateStr = lesson.replacementDate.toISOString().split('T')[0];

            const isPastDate = lessonDateStr < todayStr;
            const isTodayPastTime = lessonDateStr === todayStr && lesson.endTime <= currentTime;

            if (isPastDate || isTodayPastTime) {
              lesson.status = 'normal';
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
        console.log(`Updated schedule for class ${schedule.classId}`);
      }
    }

    console.log('Reset past substitutes job completed.');
  } catch (err) {
    console.error('Error in resetPastSubstitutes job:', err);
  }
};

const sendSubstituteEmail = async (teacher, request, formattedDate) => {
  // מוצאים את הכיתה לפי ID
  const classInfo = await Class.findOne({ _id: request.classId , schoolId: request.schoolId });

  const className = classInfo ? classInfo.name : 'Unknown Class';

  await sendEmail(
    teacher.email,
    `Substitute Request: ${request.subject}`,
    `Hello ${teacher.firstName},

We are looking for someone to cover ${request.subject} lesson for class ${className} on ${formattedDate} from ${request.startTime} to ${request.endTime}.
If you can cover it, please confirm by filling out the form here: ${request.formLink}

Thank you!`
  );
};

export const checkPendingSubstituteRequests = async () => {
  const now = new Date();

  const pendingRequests = await SubstituteRequest.find({ status: 'pending', checked: false });

  for (const request of pendingRequests) {
    const weekBefore = new Date(request.date);
    weekBefore.setDate(weekBefore.getDate() - 7);
   
    if (now >= weekBefore) {
      const { availableInternal, availableExternal } = await findCandidates(request);

      console.log('בקשה:', request._id);
      console.log('מורים פנויים פנימיים:', availableInternal.map(t => t.firstName + ' ' + t.lastName));
      console.log('מורים פנויים חיצוניים:', availableExternal.map(t => t.firstName + ' ' + t.lastName));
      
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

// יריץ כל דקה (*/1 * * * *)
export function startCheckJob() {
  cron.schedule("*/1 * * * *", async () => {
    console.log("Checking Google Sheet for new substitutes...");
    try {
      console.log("Reading sheet...");
      console.log("SHEET_ID:", SHEET_ID);
      console.log("SHEET_RANGE:", SHEET_RANGE);
      const rows = await readSheet(SHEET_ID, SHEET_RANGE);
      if (!rows || rows.length < 2) {
        console.log("No rows in sheet");
        return;
      }

      const header = rows[0].map(h => (h || "").toString());
      let processedColIndex = header.findIndex(h => /התייחסו|processed/i.test(h));
      if (processedColIndex === -1) {
        // הוספת כותרת עמודה אוטומטית (עמודה הבאה)
        processedColIndex = header.length;
        const colLetter = columnToLetter(processedColIndex + 1);
        await updateSheetCell(SHEET_ID, `${SHEET_TAB}!${colLetter}1`, "התייחסו");
        console.log("Added 'התייחסו' header at", colLetter + "1");
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
          const text = `שלום ${request.originalTeacherId.firstName} ${request.originalTeacherId.lastName},

נרשם מועמד/ת חדש/ה למלא מקום:
שם: ${firstName} ${lastName}
ת"ז: ${idNumber || "-"}
אימייל: ${email || "-"}
טלפון: ${phone || "-"}
הערות: ${notes || "-"}

אם את/ה רוצה לאשר את המחליף/ת, הכנס/י לקוד ההיעדרות במערכת: ${absenceCode}

המערכת, smartSchool.`;

          try {
            await sendEmail(teacherEmail, subject, text);
            const colLetter = columnToLetter(processedColIndex + 1);
            updates.push({ range: `${SHEET_TAB}!${colLetter}${sheetRowNumber}`, values: [["נשלח למורה"]] });
            console.log(`Notified teacher ${teacherEmail} for absence ${absenceCode}`);
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
        console.log("Updated sheet processed cells:", updates.length);
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
