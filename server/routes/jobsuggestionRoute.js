import express from 'express';
import { generateJobSuggestions } from '../controllers/JobSuggestions.js';



const router = express.Router();

router.post('/generateJobSuggestions', generateJobSuggestions);

export default router;