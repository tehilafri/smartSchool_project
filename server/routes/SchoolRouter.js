import express from 'express';
import {
  createSchool,
  getSchoolById,
  updateSchool,
  deleteSchool
} from '../controllers/SchoolController.js';
import { jwtMiddleware, requireRole } from '../Middlewares.js';
import School from '../models/School.js';
const router = express.Router();

router.post('/', jwtMiddleware, createSchool);
router.get('/:id', jwtMiddleware, getSchoolById);
router.put('/:id', jwtMiddleware, requireRole('admin'), updateSchool);
router.delete('/:id', jwtMiddleware, requireRole('admin'), deleteSchool);

export default router;
