import express from 'express';
import {getNextLessonForStudent, getNextLessonForTeacher , getScheduleByTeacher, createSchedule, updateScheduleDay,getScheduleForStudent, getHomeroomClassSchedule} from '../controllers/ScheduleController.js';
import { jwtMiddleware ,requireRole} from '../Middlewares.js';

const router = express.Router();

router.post('/createSchedule', jwtMiddleware , requireRole('teacher', 'admin'), createSchedule);
router.get('/nextLesson', jwtMiddleware, requireRole('student'), getNextLessonForStudent);
router.get('/nextLessonForTeacher', jwtMiddleware, requireRole('teacher'), getNextLessonForTeacher);
router.get('/ScheduleByTeacher', jwtMiddleware, requireRole('teacher', 'admin'), getScheduleByTeacher);
router.put('/updateDay', jwtMiddleware, requireRole('teacher', 'admin'), updateScheduleDay);
router.get('/getScheduleForStudent', jwtMiddleware, requireRole('student'), getScheduleForStudent);
router.get('/homeroomClassSchedule', jwtMiddleware, requireRole('teacher'), getHomeroomClassSchedule);

export default router;
