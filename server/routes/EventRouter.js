import express from 'express';
import { addEvent,
         getEvents,
         getEventById,
         updateEvent,
         deleteEvent } from '../controllers/EventController.js';
import { jwtMiddleware, requireRole } from '../Middlewares.js';

const router = express.Router();

router.post('/addEvent', jwtMiddleware, requireRole('admin', 'teacher'), addEvent);
router.get('/', jwtMiddleware, getEvents);
router.get('/:eventId', jwtMiddleware, getEventById);
router.put('/:eventId', jwtMiddleware, requireRole('admin','teacher'), updateEvent);
router.delete('/:eventId', jwtMiddleware, requireRole('admin', 'teacher'), deleteEvent);

export default router;
