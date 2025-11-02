import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import cron from 'node-cron';
import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/dbConn.js";
import corsOptions from "./config/corsOption.js";
import UserRouter from './routes/UserRouter.js';
import SubstituteRequestRouter from './routes/SubstituteRequestRouter.js';
import ClassRouter from './routes/ClassRouter.js';
import ScheduleRouter from './routes/ScheduleRouter.js';
import EventRouter from './routes/EventRouter.js';
import ExternalSubstituteRouter from './routes/ExternalSubstituteRouter.js';
import SchoolRouter from './routes/SchoolRouter.js';
import adminRequestRoutes from './routes/adminRequestRoutes.js';
import { resetPastSubstitutes } from './Jobs/substituteJob.js';
import { checkPendingSubstituteRequests, startCheckJob } from './Jobs/substituteJob.js';
import formRoutes from "./routes/formRouter.js";
import { startPromotionJob } from './Jobs/promotionJob.js';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const server = express();

const PORT = process.env.PORT ;

// התחברות למסד MongoDB
connectDB();

// הגדרת מדיניות CORS מותאמת
server.use(cors(corsOptions));

// תמיכה בפריסת JSON בבקשות
server.use(express.json());

// הגדרת תיקיית קבצים סטטיים לשרת
server.use(express.static("public"));
// הגדרת תיקיית uploads כסטטית כדי לאפשר גישה לתמונות לוגו
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
server.use("/uploads", express.static(path.join(__dirname, "uploads")));

// מסלול ראשי בסיסי
server.get("/", (req, res) => {
  res.send("Welcome to the main page");
});

server.use('/api/users', UserRouter);
server.use('/api/substitute-requests', SubstituteRequestRouter);
server.use('/api/classes', ClassRouter);
server.use('/api/schedule', ScheduleRouter);
server.use('/api/events', EventRouter);
server.use('/api/external-substitutes', ExternalSubstituteRouter);
server.use('/api/schools', SchoolRouter);
console.log('Registering admin-requests routes');
server.use('/api/admin-requests', adminRequestRoutes);
server.use("/form", formRoutes);

// מאזינים לאירועים של מסד הנתונים
mongoose.connection.once("open", () => {
  console.log("Database connected successfully");
  server.listen(PORT, () => {
    console.log(`Server is up and running on port ${PORT}`);
  });
});

// כל שעה – בדיקת בקשות ממתינות
cron.schedule('8 * * * *', async () => {
  await checkPendingSubstituteRequests();
});

// פעם ביום אחרי שעות הלימודים – איפוס שיעורים שעברו
cron.schedule('0 16 * * *', async () => {
  await resetPastSubstitutes();
});

startCheckJob(); // מפעיל את הג'וב ברקע

try {
  startPromotionJob(); // מפעיל את ג'וב הקידום ברקע
} catch (err) {
  console.error('Failed to start promotion job:', err);
}

mongoose.connection.on("error", (error) => {
  console.error("********** MongoDB connection error **********");
  console.error(error);
});
