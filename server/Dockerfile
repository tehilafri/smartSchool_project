# Node backend
FROM node:22.19.0-alpine

# הגדרת תיקייה לעבודה בקונטיינר
WORKDIR /app

# העתקת קבצי החבילות והתקנת תלותים
COPY package*.json ./
RUN npm install --only=production

# העתקת שאר הקוד
COPY . .

# חשיפת פורט
EXPOSE 4000

# פקודת הרצה
CMD ["node", "server.js"]
