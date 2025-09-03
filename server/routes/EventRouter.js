import express from 'express';
import { addEvent,
         getEvents,
         getEventById,
         updateEvent,
         deleteEvent } from '../controllers/EventController.js';
import { jwtMiddleware } from '../Middlewares.js';

const router = express.Router();

router.post('/addEvent', jwtMiddleware, addEvent);
router.get('/', jwtMiddleware, getEvents);
router.get('/:eventId', jwtMiddleware, getEventById);
router.put('/:eventId', jwtMiddleware, updateEvent);
router.delete('/:eventId', jwtMiddleware, deleteEvent);

export default router;
