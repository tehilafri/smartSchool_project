import express from 'express';
import { createClass, getAllClasses } from '../controllers/ClassController.js';
import { jwtMiddleware } from '../Middlewares.js';

const router = express.Router();

router.post('/createClass', jwtMiddleware, createClass);
router.get('/', jwtMiddleware, getAllClasses);


export default router;
