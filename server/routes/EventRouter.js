import express from 'express';
import { addEvent,
         reviewEventAI,
         getEvents,
         getEventById,
         updateEvent,
         deleteEvent,
         getNextExam,
         getUpcomingExams,
         getJewishHolidays
         } from '../controllers/EventController.js';
         
import { jwtMiddleware, requireRole } from '../Middlewares.js';

const router = express.Router();
router.get('/', jwtMiddleware, getEvents);
router.get('/nextExam', jwtMiddleware, requireRole('student'), getNextExam);
router.get('/upcomingExams', jwtMiddleware, requireRole('student'), getUpcomingExams);
router.get('/holidays', jwtMiddleware, getJewishHolidays);
router.post('/addEvent', jwtMiddleware, requireRole('admin', 'teacher','secretary'), addEvent);
router.post('/reviewEventAI', jwtMiddleware, requireRole('teacher', 'admin', 'secretary'), reviewEventAI);
router.get('/:eventId', jwtMiddleware, getEventById);
router.put('/:eventId', jwtMiddleware, requireRole('admin','teacher','secretary'), updateEvent);
router.delete('/:eventId', jwtMiddleware, requireRole('admin', 'teacher','secretary'), deleteEvent);

export default router;
