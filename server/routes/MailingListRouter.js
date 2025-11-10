import express from 'express';
import { subscribeToNewsletter } from '../controllers/MailingListController.js';

const router = express.Router();

router.post('/subscribe', subscribeToNewsletter);

export default router;