# (React Client Dockerfile - Multi-stage)

# --- שלב 1: בנייה (Build Stage) ---
FROM node:22.19.0-slim AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# הפקודה הזו יוצרת תיקיית 'dist'
RUN npm run build

# --- שלב 2: הגשה (Serve Stage) ---
FROM nginx:stable-alpine

# *** זה השינוי החשוב ***
# העתק מהתיקייה 'dist' (של Vite) ולא 'build' (של CRA)
COPY --from=build /app/dist /usr/share/nginx/html

# העתק קובץ הגדרות מותאם ל-Nginx (כדי לטפל ב-React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Nginx מאזין כברירת מחדל לפורט 80. Render יזהה זאת.
EXPOSE 80

# הפעל את Nginx
CMD ["nginx", "-g", "daemon off;"]