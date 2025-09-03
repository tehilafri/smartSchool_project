import express from 'express';
import {getNextLessonForStudent , getScheduleByTeacher, createSchedule, updateScheduleDay} from '../controllers/ScheduleController.js';
import { jwtMiddleware } from '../Middlewares.js';

const router = express.Router();

router.get('/nextLesson', jwtMiddleware, getNextLessonForStudent);
router.get('/ScheduleByTeacher', jwtMiddleware, getScheduleByTeacher);
router.post('/createSchedule', jwtMiddleware, createSchedule);
router.put('/updateDay', jwtMiddleware, updateScheduleDay);

export default router;
