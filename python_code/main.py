import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
from dotenv import load_dotenv
from typing import List
from datetime import datetime, timedelta
from bson import ObjectId

load_dotenv()

DATABASE_URI = os.getenv("DATABASE_URI")
client = MongoClient(DATABASE_URI)
db = client["smartSchool"]

app = FastAPI(title="AI Scheduler - Basic API")

# ----- מודל קלט -----
class EventData(BaseModel):
    type: str
    date: str  # תאריך בפורמט ISO
    startTime: str | None = None
    endTime: str | None = None
    classes: List[str]
    subject: str | None = None
    schoolId: str

# ----- בדיקה פשוטה -----
@app.get("/health")
def health_check():
    return {"status": "ok"}

# ----- ניתוח אירוע -----
@app.post("/analyze_event")
def analyze_event(event: EventData):
    try:
        # שלב 1: המרה לתאריך datetime
        exam_date = datetime.fromisoformat(event.date)
        print("event: ", event)

        # שלב 2: המרה ל-ObjectId
        try:
            school_obj_id = ObjectId(event.schoolId)
        except Exception:
            raise HTTPException(status_code=400, detail="schoolId is not a valid ObjectId")

        # שלב 2: שליפת אירועים קיימים של בית הספר
        existing_events = list(db["events"].find({"schoolId": school_obj_id}))
        print("db['events']: ", db["events"])
        print("existing_events", existing_events)
        messages = []

        # שלב 3: לולאה על כל האירועים
        for e in existing_events:
            print("e",e)
            e_type = e.get("type")
            e_date = e.get("date")
            if not e_date:
                continue
            # המרה ל-datetime אם צריך
            if isinstance(e_date, str):
                e_date = datetime.fromisoformat(e_date.replace("Z", ""))
            elif isinstance(e_date, datetime):
                pass
            else:
                # אם זה טיפוס לא צפוי, פשוט דילג
                continue

            delta_days = (exam_date - e_date).days

            # בדיקות למבחנים
            if event.type == "exam":
                # כלל 1 – מבחן יום אחרי טיול
                if e_type == "trip" and delta_days == 1:
                    messages.append("יש טיול יום לפני המבחן – פחות מומלץ.")

                # כלל 2 – שני מבחנים באותו יום
                if e_type == "exam" and delta_days == 0:
                    messages.append("כבר יש מבחן באותו יום.")

                # כלל 3 – אירוע גדול סמוך מדי
                if e_type == "activity" and abs(delta_days) <= 1:
                    messages.append("יש פעילות סמוכה מאוד – שקול לדחות את המבחן.")
            
            # בדיקות לטיולים
            elif event.type == "trip":
                # אירועים רצופים
                if e_type in ["trip", "activity"] and abs(delta_days) == 1:
                    messages.append(f"יש {e_type} יום {'לפני' if delta_days == -1 else 'אחרי'} הטיול - לא מומלץ אירועים רצופים.")
                
                # שני טיולים באותו שבוע
                week_start = exam_date - timedelta(days=exam_date.weekday())
                week_end = week_start + timedelta(days=6)
                if e_type == "trip" and week_start <= e_date <= week_end and delta_days != 0:
                    messages.append("כבר יש טיול השבוע - לא מומלץ שני טיולים באותו שבוע.")
                
                # טיול יום לפני מבחן
                if e_type == "exam" and delta_days == -1:
                    messages.append("יש מבחן למחרת הטיול - לא מומלץ.")
            
            # בדיקות לפעילויות
            elif event.type == "activity":
                # אירועים רצופים
                if e_type in ["trip", "activity"] and abs(delta_days) == 1:
                    messages.append(f"יש {e_type} יום {'לפני' if delta_days == -1 else 'אחרי'} הפעילות - לא מומלץ אירועים רצופים.")
                
                # שתי פעילויות באותו שבוע
                week_start = exam_date - timedelta(days=exam_date.weekday())
                week_end = week_start + timedelta(days=6)
                if e_type == "activity" and week_start <= e_date <= week_end and delta_days != 0:
                    messages.append("כבר יש פעילות השבוע - לא מומלץ שתי פעילויות באותו שבוע.")
                
                # פעילות יום לפני מבחן
                if e_type == "exam" and delta_days == -1:
                    messages.append("יש מבחן למחרת הפעילות - לא מומלץ.")

        if not messages:
            if event.type == "exam":
                messages.append("המבחן נראה מתאים לתאריך הנבחר.")
            elif event.type == "trip":
                messages.append("הטיול נראה מתאים לתאריך הנבחר.")
            elif event.type == "activity":
                messages.append("הפעילות נראית מתאימה לתאריך הנבחר.")
            else:
                messages.append("האירוע נראה מתאים לתאריך הנבחר.")

        return {"recommendations": messages}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
