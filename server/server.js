import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/dbConn.js";
import corsOptions from "./config/corsOption.js";
import UserRouter from './routes/UserRouter.js';
import SubstituteRequestRouter from './routes/SubstituteRequestRouter.js';

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

// מסלול ראשי בסיסי
server.get("/", (req, res) => {
  res.send("Welcome to the main page");
});

server.use('/api/users', UserRouter);
server.use('/api/substitute-requests', SubstituteRequestRouter);


// מאזינים לאירועים של מסד הנתונים
mongoose.connection.once("open", () => {
  console.log("Database connected successfully");
  server.listen(PORT, () => {
    console.log(`Server is up and running on port ${PORT}`);
  });
});

mongoose.connection.on("error", (error) => {
  console.error("********** MongoDB connection error **********");
  console.error(error);
});
