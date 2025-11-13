# (Node.js Server Dockerfile)
# 1. בחר אימג' בסיס רשמי של נוד
FROM node:22.19.0-slim

# 2. הגדר את ספריית העבודה
WORKDIR /app

# 3. העתק את קבצי ה-package.json
COPY package*.json ./

# 4. התקן תלויות
RUN npm install --production

# 5. העתק את שאר קוד השרת
COPY . .

# 6. הגדר משתנה סביבה ל-PORT
#    זהו הפורט *בתוך* הקונטיינר. הקוד שלך צריך להאזין לו.
#    Render ישתמש בפורט זה כברירת מחדל אם לא יספק אחד משלו.
ENV PORT 1000
EXPOSE 1000

# 7. פקודת ההרצה
CMD [ "node", "server.js" ]