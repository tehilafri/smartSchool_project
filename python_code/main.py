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


def get_schedules(school_obj_id: ObjectId, class_ids: List[ObjectId]):
    # המרת מחרוזות ה-classId ל-ObjectId (הנחה: ה-classes מכילים ObjectId's כסטרינג)
    # try:
    #     class_obj_ids = [c_id for c_id in class_ids]
    # except Exception:
    #     return []

    schedules_cursor = db["schedules"].find({
        "schoolId": school_obj_id,
        "classId": {"$in": class_ids}
    })

    # ניקוי הנתונים לפני שליחה למודל
    return clean_bson(list(schedules_cursor))


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

        **משימתך:** לנתח הצעה לאירוע חדש (מבחן / פעילות / טיול) בהתאם לאירועים הקיימים בלוח השנה של בית הספר.

        **מבנה הקלט:**
        - "event": האירוע החדש שמבקשים לקבוע (שדות: type, date, classes, subject אם רלוונטי).
        - "existing_events_list": רשימת האירועים הקיימים (עם אותם שדות).
        - "schedules": מערכת השעות השבועית של הכיתות המעורבות. השדות מופיעים לפי יום (sunday, monday...) וכוללים שעה (startTime) ומקצוע (subject).

        **הכללים:**
        1. **מבחנים:**
           - אסור שני מבחנים באותו יום לאותה כיתה.
           - אסור מבחנים יומיים רצופים.
           - מותר עד שני מבחנים בשבוע (ראשון–שישי).
           - אם ביום שלפני יש פעילות מעבר לשעות הלימודים או טיול בצהריים — אין לקבוע מבחן.
           -בדוק במערכת של הכיתה הנ''ל האם יש לה שיעור במקצוע המבחן בשעות וביום הרצוי ,במידה ולא, התרה על כך.
           
        2. **פעילויות:**
           - אין לקבוע פעילות אחר הצהריים יום לפני מבחן של אותה כיתה.
           - אין לקבוע פעילויות יומיות רצופות.
           - מותר עד שתי פעילויות בשבוע לאותה כיתה.
           
        3. **טיולים:**
           - אין לקבוע טיול אחרי הצהריים אם למחרת יש מבחן.
           - אין לקבוע שני טיולים באותו שבוע לאותה כיתה.

        **אם האירוע המבוקש מפר את הכללים:**
        - כתוב "is_suitable": false
        - הוסף הסבר תמציתי בשדה "recommendations" (עד 6 שורות בסך הכול) שמפרט את הסיבה,
        - הוסף גם הצעה לתאריך חלופי שמתאים לפי הכללים.
        
        -במידה ומדובר במבחן, הצע תאריך שבו יש לכיתה שיעור במקצוע של המבחן.
        -אם מדובר בקביעת מבחן ביום ובשעה שאין בה שיעור במקצוע של המבחן לכיתה הזו, התרה על כך.

        **אם האירוע עומד בכללים:**
        - כתוב "is_suitable": true
        - הסבר קצר מדוע ניתן לאשר.

        **פלט מחייב – תמיד בפורמט JSON הבא בלבד:**
        {
          "is_suitable": [true/false],
          "recommendations": ["תשובה תמציתית ומוסברת עד 6 שורות כולל הצעה חלופית אם נדרש"]
        }

        התמקד אך ורק בניתוח האירוע החדש ביחס לאירועים הקיימים ב-DB.
        אל תחרוג ממסגרת הפורמט והאורך.
        """

        prompt_content = f"""
        אירוע חדש מוצע:
        {json.dumps(clean_bson(event.model_dump()), ensure_ascii=False, indent=2)}
        
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
