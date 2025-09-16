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
router.post('/', jwtMiddleware, requireRole('admin', 'secretary'), addExternalSubstitute);
router.delete('/:identityNumber', jwtMiddleware, requireRole('admin', 'secretary'), deleteExternalSubstitute);
router.put('/:identityNumber', jwtMiddleware, requireRole('admin', 'secretary'), updateExternalSubstitute);
router.get('/', jwtMiddleware, requireRole('admin', 'secretary'), getAllExternalSubstitutes);
router.get('/identity/:identityNumber', jwtMiddleware, requireRole('admin', 'secretary'), getExternalSubstituteByIdNumber);

export default router;
