import express from 'express';
import {getNextLessonForStudent, getNextLessonForTeacher , getScheduleByTeacher, createSchedule, updateScheduleDay} from '../controllers/ScheduleController.js';
import { jwtMiddleware ,requireRole} from '../Middlewares.js';

const router = express.Router();

router.get('/nextLesson', jwtMiddleware,requireRole('student'), getNextLessonForStudent);
router.get('/nextLessonForTeacher', jwtMiddleware, requireRole('teacher'), getNextLessonForTeacher);
router.get('/ScheduleByTeacher', jwtMiddleware,requireRole('teacher', 'admin'), getScheduleByTeacher);
router.post('/createSchedule', jwtMiddleware,requireRole('teacher', 'admin'), createSchedule);
router.put('/updateDay', jwtMiddleware,requireRole('teacher', 'admin'), updateScheduleDay);

export default router;
