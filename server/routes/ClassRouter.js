import express from 'express';
import { createClass,
         getAllClasses,
         updateHomeroomTeacher,
         removeStudentFromClass,
         addStudentToClass,
        } from '../controllers/ClassController.js';
import { jwtMiddleware } from '../Middlewares.js';

const router = express.Router();

router.post('/createClass', jwtMiddleware, createClass);
router.get('/', jwtMiddleware, getAllClasses);
router.put('/updateHomeroomTeacher/:name', jwtMiddleware, updateHomeroomTeacher);
router.post('/addStudent', jwtMiddleware, addStudentToClass);
router.post('/removeStudent', jwtMiddleware, removeStudentFromClass);

export default router;
