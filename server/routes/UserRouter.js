import express from 'express';
import {
  register,
  login,
  getAllTeachers,
  getAllStudents,
  getUserById
} from '../controllers/UserController.js';
import { jwtMiddleware } from '../Middlewares.js';

const router = express.Router();

// --- Auth routes (לא צריכים middleware) ---
router.post('/register', register);
router.post('/login', login);


// --- Protected routes ---
router.get('/teachers', jwtMiddleware, getAllTeachers);
router.get('/students', jwtMiddleware, getAllStudents);
router.get('/:id', jwtMiddleware, getUserById);

export default router;
