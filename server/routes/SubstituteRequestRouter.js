import express from 'express';
import {
  reportAbsence,
  approveReplacement,
  getSubstituteRequests
} from '../controllers/SubstituteRequestController.js';
import { jwtMiddleware } from '../Middlewares.js';

const router = express.Router();

// כל ה־routes כאן מוגנים ב־JWT
router.post('/report', jwtMiddleware, reportAbsence);
router.post('/approve', jwtMiddleware, approveReplacement);
router.get('/', jwtMiddleware, getSubstituteRequests);

export default router;
