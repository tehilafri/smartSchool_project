# Python service
FROM python:3.10.0-slim

WORKDIR /app

# העתקת קובץ תלותים והתקנה
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# העתקת שאר הקוד
COPY . .

EXPOSE 5002

# פקודת הרצה
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5002", "--reload"]
