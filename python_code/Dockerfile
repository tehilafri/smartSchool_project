# (Python/Gemini Service Dockerfile - מתוקן)
FROM python:3.10.0-slim
WORKDIR /app

# העתק והתקן דרישות
COPY requirements.txt ./
# ודאי ש-uvicorn נמצא בקובץ הדרישות שלך!
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# --- התיקון הקריטי כאן ---
# נשתמש ב-uvicorn (כמו שאת רגילה) ולא ב-gunicorn
# הוא יאזין ל-main:app (כמו שאמרת)
# הוא יאזין לפורט ש-Render נותן ($PORT)
# הוא ירוץ על 0.0.0.0 (כדי להיות זמין מחוץ לקונטיינר)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]