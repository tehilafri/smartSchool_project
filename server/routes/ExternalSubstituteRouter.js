import express from 'express';
import {
  addExternalSubstitute,
  deleteExternalSubstitute,
  updateExternalSubstitute,
  getAllExternalSubstitutes,
  getExternalSubstituteByIdNumber
} from '../controllers/ExternalSubstituteController.js';
import { jwtMiddleware, requireRole } from '../Middlewares.js';
import ExternalSubstitute from '../models/ExternalSubstitute.js';

const router = express.Router();

// רק מנהל יכול לנהל ממלאי מקום חיצוניים
router.post('/', jwtMiddleware, requireRole('admin'), addExternalSubstitute);
router.delete('/:identityNumber', jwtMiddleware, requireRole('admin'), deleteExternalSubstitute);
router.put('/:identityNumber', jwtMiddleware, requireRole('admin'), updateExternalSubstitute);
router.get('/', jwtMiddleware, requireRole('admin'), getAllExternalSubstitutes);
router.get('/identity/:identityNumber', jwtMiddleware, requireRole('admin'), getExternalSubstituteByIdNumber);

export default router;
