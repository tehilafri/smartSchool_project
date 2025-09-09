import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export const jwtMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // בדיקה אם מתחיל ב-Bearer
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Invalid token format' });
  }

  const token = parts[1];
  const secret = process.env.JWT_SECRET;

  try {
    const decoded = jwt.verify(token, secret);

    // נשמרים הנתונים מתוך ה־JWT
    req.id = decoded.id;          // מזהה המשתמש
    req.role = decoded.role;      // תפקיד (מורה/מנהלת/תלמיד)
    req.schoolId = decoded.schoolId; // מזהה בית ספר אמיתי של מונגו

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    } else {
      return res.status(500).json({ message: 'Server error' });
    }
  }
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.role) {
      return res.status(401).json({ message: "Unauthorized - no role found" });
    }

    if (!allowedRoles.includes(req.role)) {
      return res.status(403).json({ message: "Forbidden - insufficient permissions" });
    }

    next();
  };
};




