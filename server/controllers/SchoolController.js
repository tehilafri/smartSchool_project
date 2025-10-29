import School from '../models/School.js';
import User from '../models/User.js';
import Schedule from '../models/Schedule.js';
import { generateCode } from '../utils/generatedCode.js';
import { sendEmail } from '../utils/email.js';
import bcrypt from 'bcrypt';
import path from 'path';

export const createSchool = async (req, res) => {
  try {
    let { name, principalId, address, phone, email, website, description, scheduleHours } = req.body;

    // פענוח scheduleHours אם הוא string (מגיע מ-FormData)
    if (typeof scheduleHours === "string") {
      try {
        scheduleHours = JSON.parse(scheduleHours);
      } catch (e) {
        scheduleHours = [];
      }
    }

    // מאתרים את המנהלת לפי ת"ז
    const admin = await User.findOne({ userId: principalId, role: 'admin' });
    if (!admin) {
      return res.status(404).json({ message: 'Admin with this ID not found' });
    }

    const schoolCode = generateCode();

    // טיפול בתמונה
    let imageUrl = '';
    if (req.file) {
    // בונה URL מלא על בסיס הבקשה בפועל
    const protocol = req.protocol; // ייתן 'http'
    const host = req.get('host');  // ייתן 'localhost:1000'
    imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    } 

    let { minGrade, maxGrade } = req.body;   // המרה לערכים תקינים: ריקות -> null
    if (typeof minGrade === 'string') {
      minGrade = minGrade.trim() === '' ? null : minGrade.trim();
    }
    if (typeof maxGrade === 'string') {
      maxGrade = maxGrade.trim() === '' ? null : maxGrade.trim();
    }
    // וולידציה קלה לפי ערכי דרגות מקובלים (אפשר להרחיב במידת הצורך)
    const allowedGrades = ['א','ב','ג','ד','ה','ו','ז','ח','ט','י','יא','יב','יג','יד'];
    if (minGrade && !allowedGrades.includes(minGrade)) minGrade = null;
    if (maxGrade && !allowedGrades.includes(maxGrade)) maxGrade = null;

    // יצירת בית ספר
    const school = new School({
      name,
      schoolCode: schoolCode,
      principalId: admin._id,
      address,
      phone,
      email,
      website,
      description,
      imageUrl,
      schoolCode,
      scheduleHours: scheduleHours || [],
      minGrade: minGrade || null,
      maxGrade: maxGrade || null
    });

    await school.save();

    // עדכון המנהלת לשיוך לבית ספר ויצירת קוד חדש
    const oldSchool = await School.findById(admin.schoolId);
    console.log('Old school:', oldSchool?.schoolCode);
    
    if (oldSchool && oldSchool.schoolCode.startsWith('TEMP_'))  // כל קוד שמתחיל ב-TEMP_
 {
      console.log('Deleting temporary school and resetting password');
      await School.findByIdAndDelete(admin.schoolId);
      
      // איפוס סיסמה לזמנית כדי שהמנהלת תוכל להתחבר
      const salt = await bcrypt.genSalt(10);
      const newHashedPassword = await bcrypt.hash('12345678', salt);
      admin.password = newHashedPassword;
      console.log('Password reset completed');
    }
    
    admin.schoolId = school._id;
    await admin.save();
    console.log('Admin updated with new school ID');
    
    // שליחת מייל עם הקוד החדש
    await sendEmail({
      to: admin.email,
      subject: 'בית הספר נרשם בהצלחה - Smart School',
      html: `
        <div dir="rtl">
          <h2>שלום ${admin.firstName} ${admin.lastName},</h2>
          <p><strong>בית הספר נרשם בהצלחה!</strong></p>
          <br>
          <p><strong>קוד בית הספר החדש שלך:</strong> ${schoolCode}</p>
          <p>שמור את הקוד הזה - תצטרך אותו להתחברות עתידית.</p>
          <p><strong>הסיסמה שלך כרגע:</strong> 12345678</p>
          <p>אנא שנה את הסיסמה באמצעות "שכחתי סיסמה" לפני ההתחברות.</p>
          <br>
          <p>בברכה,<br>צוות Smart School</p>
        </div>
      `
    });

    res.status(201).json({
      message: 'School created successfully',
      school: {
        id: school._id,
        name: school.name,
        schoolCode: school.schoolCode,
        imageUrl: school.imageUrl
      }
    });
  } catch (err) {
    console.error('שגיאה ביצירת בית ספר:', err);
    res.status(400).json({ message: err.message });
  }
};

export const getSchoolById = async (req, res) => {
  try {
    const { id } = req.params;
    const school = await School.findOne({ schoolCode: id });
    if (!school) return res.status(404).json({ message: 'School not found' });
    if (school && school.imageUrl && school.imageUrl.startsWith('/uploads/')) {
      school.imageUrl = `${req.protocol}://${req.get('host')}${school.imageUrl}`;
    }

    res.json(school);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

export const updateSchool = async (req, res) => {
  try {
    const schoolId = req.schoolId;
    const { id } = req.params;

    if (schoolId !== id) {
      return res.status(403).json({ message: 'Access denied: unauthorized school' });
    }

    const updates = req.body;

    const school = await School.findById(id);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const allowedGrades = ['א','ב','ג','ד','ה','ו','ז','ח','ט','י','יא','יב','יג','יד'];

    // ולידציה עבור כיתה מינימלית (אם נשלחה)
    if (updates.minGrade !== undefined) {
      if (typeof updates.minGrade === 'string') {
        updates.minGrade = updates.minGrade.trim();
        // אם נשלח ריק או ערך לא חוקי -> אפס ל-null
        if (updates.minGrade === '' || !allowedGrades.includes(updates.minGrade)) {
          updates.minGrade = null;
        }
      } else if (updates.minGrade === null) {
        // מאפשר שמירת null
        updates.minGrade = null;
      } else {
        updates.minGrade = null; 
      }
    }
    
    // ולידציה עבור כיתה מקסימלית (אם נשלחה)
    if (updates.maxGrade !== undefined) {
      if (typeof updates.maxGrade === 'string') {
        updates.maxGrade = updates.maxGrade.trim();
        // אם נשלח ריק או ערך לא חוקי -> אפס ל-null
        if (updates.maxGrade === '' || !allowedGrades.includes(updates.maxGrade)) {
          updates.maxGrade = null;
        }
      } else if (updates.maxGrade === null) {
        updates.maxGrade = null;
      } else {
        updates.maxGrade = null;
      }
    }

    // שמירת מערכת השעות הישנה לצורך השוואה
    const oldScheduleHours = school.scheduleHours ? [...school.scheduleHours] : [];
    
    // עדכון השדות מהבקשה (כולל שדות הטווח שעברו ולידציה)
    Object.assign(school, updates);

    // שמירה - כאן pre('save') ירוץ וימלא את number ב-scheduleHours
    await school.save();

    // ... (המשך הלוגיקה של עדכון מערכת שעות נשאר זהה) ...
    if (updates.scheduleHours) {
    const newScheduleHours = school.scheduleHours || [];
      
      // בדיקה אם יש שינוי במערכת השעות
      const hoursChanged = oldScheduleHours.length !== newScheduleHours.length ||
        oldScheduleHours.some((oldHour, index) => {
          const newHour = newScheduleHours[index];
          return !newHour || oldHour.start !== newHour.start || oldHour.end !== newHour.end;
        });

      if (hoursChanged) {
        console.log('Schedule hours changed, updating existing schedules...');
        
        // מציאת כל המערכות של בית הספר
        const existingSchedules = await Schedule.find({ schoolId: id });
        
        for (const schedule of existingSchedules) {
          let scheduleUpdated = false;
          
          // עדכון כל יום בשבוע
          const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
          
          for (const day of days) {
            if (schedule.weekPlan[day] && schedule.weekPlan[day].length > 0) {
              // סינון שיעורים שעדיין קיימים במערכת החדשה
              const validLessons = schedule.weekPlan[day].filter(lesson => {
                return lesson.lessonNumber <= newScheduleHours.length;
              });
              
              // עדכון זמני השיעורים לפי המערכת החדשה
              validLessons.forEach(lesson => {
                const hourInfo = newScheduleHours[lesson.lessonNumber - 1];
                if (hourInfo) {
                  lesson.startTime = hourInfo.start;
                  lesson.endTime = hourInfo.end;
                }
              });
              
              // אם יש שיעורים שנמחקו
              if (schedule.weekPlan[day].length !== validLessons.length) {
                scheduleUpdated = true;
                console.log(`Removed ${schedule.weekPlan[day].length - validLessons.length} lessons from ${day}`);
              }
              
              schedule.weekPlan[day] = validLessons;
            }
          }
          
          // שמירת המערכת המעודכנת
          if (scheduleUpdated || newScheduleHours.length !== oldScheduleHours.length) {
            await schedule.save();
            console.log(`Updated schedule for class ${schedule.classId}`);
          }
        }

        console.log(`Updated ${existingSchedules.length} existing schedules`);
      }
    }

    res.json({ message: 'School updated successfully', school });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

export const deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolId = req.schoolId;

    if (schoolId !== id) {
      return res.status(403).json({ message: 'Access denied: unauthorized school' });
    }

    const school = await School.findByIdAndDelete(id);
    if (!school) return res.status(404).json({ message: 'School not found' });

    res.json({ message: 'School deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};
