# אפשר להישאר עם 22 אם את מעדיפה
FROM node:22.19.0-slim

WORKDIR /app

COPY package*.json ./

# התקנה
RUN npm install --production

COPY . .

# כאן אנחנו רק מצהירים (תיעוד), זה לא פותח פורט בפועל.
# נהוג לכתוב את פורט ברירת המחדל שלנו.
EXPOSE 3000

# הפקודה המקורית שלך
CMD [ "node", "server.js" ]