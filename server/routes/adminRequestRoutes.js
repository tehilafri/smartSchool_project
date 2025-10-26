import express from 'express';
import { submitAdminRequest, approveAdminRequest } from '../controllers/AdminRequestController.js';

const router = express.Router();

router.post('/submit', submitAdminRequest);
router.get('/approve/:token', approveAdminRequest);

export default router;