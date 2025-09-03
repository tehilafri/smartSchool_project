import express from 'express';
import {
  reportAbsence,
  approveReplacement,
  getSubstituteRequests
} from '../controllers/SubstituteRequestController.js';
import { jwtMiddleware } from '../Middlewares.js';

const router = express.Router();

// כל ה־routes כאן מוגנים ב־JWT
router.post('/report', jwtMiddleware,requireRole('teacher', 'admin'), reportAbsence);
router.post('/approve', jwtMiddleware, requireRole('teacher'), approveReplacement);
router.get('/', jwtMiddleware, requireRole('admin,teacher'), getSubstituteRequests);

export default router;
