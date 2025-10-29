import express from 'express';
import { createClass,
         getAllClasses,
         updateHomeroomTeacher,
         removeStudentFromClass,
         addStudentToClass,
         deleteClass,
         getStudentsByClass
        } from '../controllers/ClassController.js';
import { jwtMiddleware, requireRole } from '../Middlewares.js';
const router = express.Router();

router.post('/createClass', jwtMiddleware, requireRole('admin','secretary'), createClass);
router.get('/', jwtMiddleware, getAllClasses);
router.put('/updateHomeroomTeacher/:className', jwtMiddleware, requireRole('admin', 'secretary'), updateHomeroomTeacher);
router.post('/addStudent', jwtMiddleware, requireRole('admin', 'secretary'), addStudentToClass);
router.post('/removeStudent', jwtMiddleware, requireRole('admin', 'secretary'), removeStudentFromClass);
router.delete('/:name', jwtMiddleware, requireRole('admin', 'secretary'), deleteClass);
router.get('/studentsByName/:className', jwtMiddleware, requireRole('admin', 'secretary', 'teacher'), getStudentsByClass);

export default router;
