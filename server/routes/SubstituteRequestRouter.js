import express from 'express';
import {
  reportAbsence,
  approveReplacement,
  getSubstituteRequests,
  approveReplacementByEmail
} from '../controllers/SubstituteRequestController.js';
import { jwtMiddleware, requireRole} from '../Middlewares.js';
import SubstituteRequest from '../models/SubstituteRequest.js';

const router = express.Router();

// כל ה־routes כאן מוגנים ב־JWT
router.post('/report', jwtMiddleware , requireRole('teacher'), reportAbsence);
router.post('/approve', jwtMiddleware, requireRole('teacher'), approveReplacement);
router.get('/approve-email/:absenceCode', approveReplacementByEmail);
router.get('/', jwtMiddleware, requireRole('admin', 'teacher'), getSubstituteRequests);

export default router;
