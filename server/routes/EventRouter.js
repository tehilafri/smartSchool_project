import express from 'express';
import { addEvent,
         getEvents,
         getEventById,
         updateEvent,
         deleteEvent,
         getNextExam,
         getUpcomingExams
         } from '../controllers/EventController.js';
import { jwtMiddleware, requireRole } from '../Middlewares.js';

const router = express.Router();

router.post('/addEvent', jwtMiddleware, requireRole('admin', 'teacher','secretary'), addEvent);
router.get('/', jwtMiddleware, getEvents);
router.get('/:eventId', jwtMiddleware, getEventById);
router.put('/:eventId', jwtMiddleware, requireRole('admin','teacher','secretary'), updateEvent);
router.delete('/:eventId', jwtMiddleware, requireRole('admin', 'teacher','secretary'), deleteEvent);
router.get("/upcomingExams", jwtMiddleware, requireRole('student'), getUpcomingExams);
router.get("/nextExam", jwtMiddleware, requireRole('student'), getNextExam);


export default router;
