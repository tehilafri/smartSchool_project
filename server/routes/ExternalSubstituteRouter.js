import express from 'express';
import {
  addExternalSubstitute,
  deleteExternalSubstitute,
  updateExternalSubstitute,
  getAllExternalSubstitutes,
  getExternalSubstituteByIdNumber,
  getExternalSubstituteByIDOfMongo
} from '../controllers/ExternalSubstituteController.js';
import { jwtMiddleware, requireRole } from '../Middlewares.js';
import ExternalSubstitute from '../models/ExternalSubstitute.js';

const router = express.Router();

// רק מנהל יכול לנהל ממלאי מקום חיצוניים
router.post('/', jwtMiddleware, requireRole('admin', 'secretary'), addExternalSubstitute);
router.get('/', jwtMiddleware, requireRole('admin', 'secretary', 'teacher', 'student'), getAllExternalSubstitutes);
router.get('/identity/:identityNumber', jwtMiddleware, requireRole('admin', 'secretary', 'teacher', 'student'), getExternalSubstituteByIdNumber);
router.get('/:id', jwtMiddleware, requireRole('admin', 'secretary', 'teacher', 'student'), getExternalSubstituteByIDOfMongo);
router.delete('/:identityNumber', jwtMiddleware, requireRole('admin', 'secretary'), deleteExternalSubstitute);
router.put('/:identityNumber', jwtMiddleware, requireRole('admin', 'secretary'), updateExternalSubstitute);
export default router;
