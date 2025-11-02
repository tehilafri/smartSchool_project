import cron from 'node-cron';
import School from '../models/School.js';
import ClassModel from '../models/Class.js';
import User from '../models/User.js';

// Grades order for promotion (from lowest to highest)
const gradesOrder = ['א','ב','ג','ד','ה','ו','ז','ח','ט','י','יא','יב','יג','יד'];

// Helper: find grade prefix in class name (longest match first)
function extractGradePrefix(className) {
  if (!className) return null;
  const sorted = [...gradesOrder].sort((a,b) => b.length - a.length);
  for (const g of sorted) {
    if (className.startsWith(g)) return { grade: g, remainder: className.slice(g.length) };
  }
  return null;
}

/**
 * הפונקציה המעודכנת לקידום תלמידים.
 * לוגיקה זו מבוססת על שליפת כל התלמידים ועדכון כל אחד בנפרד,
 * במקום לולאה על הכיתות, מה שמונע את הבאג של "מצב המרוץ".
 */
async function runPromotionIfNeeded() {
  try {
    const now = new Date() 
    const month = now.getMonth(); // 0..11 (September is 8)
    const day = now.getDate();
    const year = now.getFullYear();

    // 1. הפעלה רק ב-1 בספטמבר
    if (!(month === 8 && day === 1)) {
      console.log('Skipping promotion: Not September 1st.');
      return; 
    }

    const schools = await School.find({});
    for (const school of schools) {
      
      // 2. בדיקת כפילויות (Idempotency) - מניעת הרצה חוזרת באותה שנה
      if (school.lastPromotedYear === year) {
        console.log(`Skipping promotion for ${school.name}: already promoted in ${year}`);
        continue;
      }

      // 3. איתור כיתת הבוגרים לפי הגדרות בית הספר
      const maxGrade = school.maxGrade; // קורא את ה-string מהמודל של בית הספר
      if (!maxGrade) {
        console.warn(`Skipping promotion for ${school.name}: maxGrade is not set.`);
        continue; // לא ניתן לקדם אם לא יודעים מתי מסיימים
      }

      // 4. שליפת *כל* התלמידים הפעילים בבית הספר
      const studentsInSchool = await User.find({ 
        schoolId: school._id, 
        role: 'student',
        status: { $ne: 'graduate' } // שלוף רק תלמידים שאינם בוגרים
      }).populate('classes'); // חשוב לשלוף את נתוני הכיתה שלהם

      
      // מפה לניהול כיתות יעד (כדי לא לחפש ב-DB כל פעם)
      const targetClassesMap = {};

      // 5. לולאה ראשית - עוברת על *תלמיד-תלמיד*
      for (const student of studentsInSchool) {
        if (!student.classes || student.classes.length === 0) {
          continue; // תלמיד ללא כיתה, דלג
        }

        // הנחה: הכיתה הראשונה במערך היא כיתת האם העיקרית של התלמיד
        const oldClass = student.classes[0];
        if (!oldClass || !oldClass.name) continue; 

        const parsed = extractGradePrefix(oldClass.name);
        if (!parsed) continue; // שם כיתה לא תקין (למשל "ספרייה"), דלג

        const currentIndex = gradesOrder.indexOf(parsed.grade);
        if (currentIndex === -1) continue;

        
        // --- לוגיקת סיום לימודים (בוגרים) ---
        if (parsed.grade === maxGrade) {
          // 1. עדכון התלמיד לבוגר והסרת שיוך לכיתה
          await User.updateOne(
            { _id: student._id },
            { 
              $set: { status: 'graduate' },
              $pull: { classes: oldClass._id } 
            }
          );
          // 2. הסרת התלמיד מרשימת התלמידים בכיתה הישנה
          await ClassModel.updateOne(
            { _id: oldClass._id },
            { $pull: { students: student._id } }
          );
        } 
        
        // --- לוגיקת קידום כיתה רגיל ---
        else if (currentIndex < gradesOrder.length - 1) {
          const nextGrade = gradesOrder[currentIndex + 1];
          const newName = `${nextGrade}${parsed.remainder || ''}`; // e.g. 'ד2'

          // 3. איתור או יצירה של כיתת היעד
          let targetClass = targetClassesMap[newName];
          if (!targetClass) {
            targetClass = await ClassModel.findOne({ schoolId: school._id, name: newName });
            if (!targetClass) {
              // יוצר את הכיתה אם היא לא קיימת
              targetClass = await ClassModel.create({
                schoolId: school._id,
                name: newName,
                homeroomTeacher: null, 
                students: []
              });
            }
            targetClassesMap[newName] = targetClass; // שמירה במפה לשימוש חוזר
          }

          // 4a. הסרה מהכיתה הישנה
          await User.updateOne(
            { _id: student._id },
            { $pull: { classes: oldClass._id } }
          );

          // 4b. הוספה לכיתה החדשה
          await User.updateOne(
            { _id: student._id },
            { $push: { classes: targetClass._id } }
          );

          // 5. עדכון הכיתות: הסרה מהישנה, הוספה לחדשה
          // (זה מבטיח עקביות מלאה של הנתונים)
          await ClassModel.updateOne(
            { _id: oldClass._id },
            { $pull: { students: student._id } }
          );
          await ClassModel.updateOne(
            { _id: targetClass._id },
            { $addToSet: { students: student._id } } // $addToSet בטוח יותר מ-$push
          );
        }
        // (אם התלמיד בכיתה י"ד והרשימה נגמרת, הוא לא יטופל - וזה בסדר)
      }

      // 6. סימון בית הספר כמי שקודם השנה
      school.lastPromotedYear = year;
      await school.save();
      console.log(`Promotion successful for ${school.name} for year ${year}`);
    }
  } catch (err) {
    console.error('Error running promotion job:', err);
  }
}

// קוד התזמון (נשאר זהה)
export function startPromotionJob() {
  // run at 00:05 every day
  cron.schedule('5 0 * * *', async () => {
    await runPromotionIfNeeded();
  }, {
    timezone: process.env.SERVER_TIMEZONE || 'UTC'
  });

  // also run once on startup
  (async () => {
    await runPromotionIfNeeded();
  })();
}