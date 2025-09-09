import express from 'express';
import { createClass,
         getAllClasses,
         updateHomeroomTeacher,
         removeStudentFromClass,
         addStudentToClass,
        } from '../controllers/ClassController.js';
import { jwtMiddleware, requireRole } from '../Middlewares.js';
import Class from '../models/Class.js';
const router = express.Router();

router.post('/createClass', jwtMiddleware, requireRole('admin'), createClass);
router.get('/', jwtMiddleware, getAllClasses);
router.put('/updateHomeroomTeacher/:className', jwtMiddleware, requireRole('admin'), updateHomeroomTeacher);
router.post('/addStudent', jwtMiddleware, requireRole('admin'), addStudentToClass);
router.post('/removeStudent', jwtMiddleware, requireRole('admin'), removeStudentFromClass);

export default router;
