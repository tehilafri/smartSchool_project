import express from 'express';
import {
  register,
  login,
  getAllTeachers,
  getAllStudents,
  getUserById,
  updateUser,
  forgotPassword,
  resetPassword
} from '../controllers/UserController.js';
import { jwtMiddleware, requireRole } from '../Middlewares.js';

const router = express.Router();

// --- Auth routes (לא צריכים middleware) ---
router.post('/register', jwtMiddleware, requireRole('admin', 'secretary'), register);
router.post('/login', login);


// --- Protected routes ---
router.get('/teachers', jwtMiddleware, getAllTeachers);
router.get('/students', jwtMiddleware, getAllStudents);
router.get('/:id', jwtMiddleware, getUserById);
router.put('/:id', jwtMiddleware, updateUser);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

export default router;
