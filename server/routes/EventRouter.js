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
router.get('/', jwtMiddleware, getEvents);
router.get('/nextExam', jwtMiddleware, requireRole('student'), getNextExam);
router.get('/upcomingExams', jwtMiddleware, requireRole('student'), getUpcomingExams);
router.post('/addEvent', jwtMiddleware, requireRole('admin', 'teacher','secretary'), addEvent);
router.get('/:eventId', jwtMiddleware, getEventById);
router.put('/:eventId', jwtMiddleware, requireRole('admin','teacher','secretary'), updateEvent);
router.delete('/:eventId', jwtMiddleware, requireRole('admin', 'teacher','secretary'), deleteEvent);


export default router;
