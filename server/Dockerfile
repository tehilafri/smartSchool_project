# # Node backend
# FROM node:22.19.0-alpine

# # הגדרת תיקייה לעבודה בקונטיינר
# WORKDIR /app

# # העתקת קבצי החבילות והתקנת תלותים
# COPY package*.json ./
# RUN npm install 

# # העתקת שאר הקוד
# COPY . .

# # חשיפת פורט
# EXPOSE 1000

# HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
#   CMD wget --no-verbose --tries=1 --spider http://localhost:1000 || exit 1

# # פקודת הרצה
# CMD ["node", "server.js"]


FROM node:22.19.0-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 1000

CMD ["node", "server.js"]

