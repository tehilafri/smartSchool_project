import express from 'express';
import {
  register,
  login,
  getAllTeachers,
  getAllStudents,
  getUserById,
  updateUser,
  forgotPassword,
  resetPassword,
  getMe,
  getAllSecretaries
} from '../controllers/UserController.js';
import { jwtMiddleware, requireRole } from '../Middlewares.js';
import User from '../models/User.js';

const router = express.Router();
//
//
//חשוב מאד!!!
//עדיין לא עשינו אופציה של הוספה של מנהלת בצורה נכונה וחכמה...
//
//

// --- Auth routes (לא צריכים middleware) ---
router.post('/register', jwtMiddleware, requireRole('admin', 'secretary'), register);
router.post('/login', login);


// --- Protected routes ---
router.get('/me', jwtMiddleware, getMe);
router.get('/teachers', jwtMiddleware, getAllTeachers);
router.get('/students', jwtMiddleware, getAllStudents);
router.get('/:id', jwtMiddleware, getUserById);
router.put('/:id', jwtMiddleware, updateUser);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/secretaries', jwtMiddleware, getAllSecretaries);




export default router;
