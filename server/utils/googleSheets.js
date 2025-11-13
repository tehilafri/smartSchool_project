import { google } from "googleapis";
import fs from "fs";
import path from "path";

const SHEET_TAB = process.env.SHEET_TAB_NAME;

const credentialsPath = "./credentials.json";
if (!fs.existsSync(credentialsPath)) {
  throw new Error("Missing Google service account credentials.json at credentials.json");
}
const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]; // קריאה + כתיבה

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: SCOPES,
});

async function getSheets() {
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

export async function readSheet(spreadsheetId, range) {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return res.data.values || [];
}

export async function updateSheetCell(spreadsheetId, range, value) {
  const sheets = await getSheets();
  return sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[value]] },
  });
}

export async function batchUpdate(spreadsheetId, data /* array of {range, values:[[...]]} */) {
  const sheets = await getSheets();
  return sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "RAW",
      data,
    },
  });
}

/**
 * מסמן שורות בגיליון כ'טופל' עבור absenceCode נתון.
 * מחזיר כמות השורות ששונו.
 * sheetRange ברירת מחדל: 'Responses!A:Z'
 */
export async function markRowsProcessedByAbsenceCode(spreadsheetId, sheetRange = `'${SHEET_TAB}'!A:Z`, absenceCode, processedValue = "טופל") {
  const rows = await readSheet(spreadsheetId, sheetRange);
  if (!rows || rows.length < 2) return 0;

  const header = rows[0].map(h => (h || "").toString());
  // חפש עמודה בשם 'התייחסו' או 'processed'
  let processedColIndex = header.findIndex(h => /התייחסו|processed/i.test(h));
  if (processedColIndex === -1) {
    // אם אין, נוסיף אותה אחרי העמודות הקיימות (כעמודה הבאה)
    processedColIndex = header.length; // 0-based
    const colLetter = columnToLetter(processedColIndex + 1);
    await updateSheetCell(spreadsheetId, `"${SHEET_TAB}"!${colLetter}1`, "התייחסו");
    // יש לעדכן גם את header במערך המקומי כדי שנוכל להשתמש בו
    header.push("התייחסו");
  }

  const updates = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const code = (row[5] || "").toString(); // column F (index 5) הוא absenceCode לפי המפרט שלך
    const already = row[processedColIndex];
    if (code === absenceCode && (!already || already === "")) {
      const sheetRowNumber = i + 1; // rows[0] -> sheet row 1
      const colLetter = columnToLetter(processedColIndex + 1);
      updates.push({ range: `${SHEET_TAB}!${colLetter}${sheetRowNumber}`, values: [[processedValue]] });
    }
  }

  if (updates.length > 0) {
    await batchUpdate(spreadsheetId, updates);
  }
  return updates.length;
}

function columnToLetter(col) {
  let temp;
  let letter = "";
  while (col > 0) {
    temp = (col - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    col = (col - temp - 1) / 26;
  }
  return letter;
}
