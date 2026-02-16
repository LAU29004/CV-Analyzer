import express from 'express';
import { generateRoadmap, uploadMiddleware } from '../controllers/roadmap.controller.js';

const router = express.Router();

router.post('/generate', uploadMiddleware, generateRoadmap);

export default router;
