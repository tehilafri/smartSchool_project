import os
import json
import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
from dotenv import load_dotenv
from typing import List
from datetime import datetime
from bson import ObjectId
from urllib3.exceptions import InsecureRequestWarning

# ביטול אזהרות SSL (לשרתים פנימיים עם תעודה לא חתומה)
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

# --- טעינת משתני סביבה ---
load_dotenv()

# --- חיבור למסד הנתונים ---
DATABASE_URI = os.getenv("DATABASE_URI")
if not DATABASE_URI:
    raise RuntimeError("DATABASE_URI is missing in .env")

client = MongoClient(DATABASE_URI)
db = client["smartSchool"]

# --- הגדרות Gemini ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is missing in .env")

GEMINI_MODEL = "gemini-2.5-flash"

# --- אפליקציה ראשית ---
app = FastAPI(title="AI Scheduler - REST Gemini Version")


# ----- מבנה הנתונים הנכנס -----
class EventData(BaseModel):
    type: str
    date: str
    startTime: str | None = None
    endTime: str | None = None
    classes: List[str]
    subject: str | None = None
    schoolId: str
    mode: str | None = None


# ----- בריאות השרת -----
@app.get("/health")
def health_check():
    return {"status": "ok"}


# ----- פונקציות עזר -----
def clean_bson(obj):
    if isinstance(obj, list):
        return [clean_bson(x) for x in obj]
    elif isinstance(obj, dict):
        return {k: clean_bson(v) for k, v in obj.items()}
    elif isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, datetime):
        return obj.isoformat()
    return obj


def get_schedules(school_obj_id: ObjectId, class_names: List[str]):

    # חיפוש כיתות לפי שם
    classes_query = {
        "schoolId": school_obj_id,
        "name": {"$in": class_names}
    }

    classes_cursor = db["classes"].find(classes_query)
    classes_list = list(classes_cursor)

    if not classes_list:
        print("DEBUG: No classes found with given names")
        return []
    
    # חילוץ ObjectId של הכיתות
    class_obj_ids = [cls["_id"] for cls in classes_list]

    # חיפוש מערכות שעות לפי classId
    schedules_query = {
        "schoolId": school_obj_id,
        "classId": {"$in": class_obj_ids}
    }

    schedules_cursor = db["schedules"].find(schedules_query)
    schedules_list = list(schedules_cursor)

    # ניקוי הנתונים לפני שליחה למודל
    cleaned_schedules = clean_bson(schedules_list)
    return cleaned_schedules


def query_gemini(prompt: str, system_instruction: str | None = None):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"

    headers = {
        "Content-Type": "application/json"
    }

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"response_mime_type": "application/json"}
    }

    if system_instruction:
        payload["system_instruction"] = {"parts": [{"text": system_instruction}]}

    response = requests.post(url, headers=headers, json=payload, verify=False)

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Gemini Error {response.status_code}: {response.text}")

    try:
        data = response.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(text)
    except Exception as e:
        print("!!! RAW GEMINI RESPONSE:", response.text)
        raise HTTPException(status_code=500, detail=f"Gemini parse error: {str(e)}")


# ----- ניתוח אירוע -----
@app.post("/analyze_event")
def analyze_event(event: EventData):
    try:
        # אימות בסיסי
        try:
            event_date = datetime.fromisoformat(event.date)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid date format")

        try:
            school_obj_id = ObjectId(event.schoolId)
        except Exception:
            raise HTTPException(status_code=400, detail="schoolId is not a valid ObjectId")

        # שליפת אירועים קיימים
        existing_events = list(db["events"].find({"schoolId": school_obj_id}))
        existing_events = clean_bson(existing_events)
        schedules = get_schedules(school_obj_id, event.classes)

        system_instruction = """
        אתה יועץ תזמון אסטרטגי ומדויק למוסדות חינוך, מומחה בניהול יומנים ובשמירה על איזון לימודי ורגשי לתלמידים ולמורים.                 
        משימה: נתח הצעה לאירוע חדש (מבחן / פעילות / טיול) לפי הכללים,  מול האירועים הקיימים בלוח השנה.

        מבנה קלט:
        - event: האירוע (type, date, classes, subject, mode).
        - existing_events_list: רשימת אירועים קיימים.
        - schedules: מערכת השעות של הכיתות לפי יום (sunday–friday) ושעה (startTime, subject).

        כללים:
        1. לוגיקת מצב עריכה (Edit Mode Logic):
           - בדוק את הפרמטר 'mode' של ה-event.
           - אם mode הוא 'edit': עליך לאתר ב-existing_events_list את האירוע הישן בעל אותו id, ו**להתעלם** ממנו לחלוטין בחישובי ההתנגשויות. (האירוע אינו יכול להתנגש עם הגרסה הקודמת של עצמו מכיוון שמדובר באותו אירוע).
           - אם mode הוא 'add': בדוק התנגשויות מול כל הרשימה כפי שהיא.
        2. מבחנים:
           - אין שני מבחנים באותו יום לאותה כיתה.
           - אין מבחנים יומיים רצופים.
           - עד שני מבחנים בשבוע.
           - אם ביום שלפני יש פעילות מעבר לשעות הלימוד או טיול — אל תקבע מבחן.
           - אם אין שיעור במקצוע המבחן ביום המבוקש – התרע.
        3. פעילויות:
           - אין פעילות אחר הצהריים יום לפני מבחן.
           - אין פעילויות רצופות.
           - עד שתי פעילויות בשבוע.
        4. טיולים:
           - אין טיול אחרי הצהריים אם למחרת מבחן.
           - אין שני טיולים באותו שבוע.

        אם האירוע מפר כללים:
        - is_suitable: false
        - recommendations: הסבר תמציתי (עד 6 שורות) עם סיבה והצעת תאריך חלופי.
        - אם זה מבחן – הצע יום שיש בו שיעור במקצוע המבחן.

        אם עומד בכללים:
        - is_suitable: true
        - recommendations: נימוק קצר לאישור.

        פלט ב-JSON בלבד:
        {
          "is_suitable": [true/false],
          "recommendations": ["הסבר קצר עד 6 שורות"]
        }

        הסתמך רק על הנתונים שנמסרו, בלי חריגה מהפורמט.
        """

        event_data = clean_bson(event.model_dump())
        
        prompt_content = f"""
        אירוע חדש מוצע:
        {json.dumps(event_data, ensure_ascii=False, indent=2)}
        
        אירועים קיימים בבית הספר:
        {json.dumps(existing_events, ensure_ascii=False, indent=2)}
        
        מערכות שעות רלוונטיות:
        {json.dumps(schedules, ensure_ascii=False, indent=2)}
        
            בהתבסס על הנתונים לעיל, נתח האם האירוע החדש המוצע הוא מתאים.
            אם האירוע לא מתאים, ציין את הסיבה העיקרית- בלי התפלספויות מיותרות. אם הוא מתאים, ציין זאת.
        """
        

        # קריאה למודל
        analysis_result = query_gemini(prompt_content, system_instruction)

        # החזרת תשובה ללקוח
        return analysis_result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
