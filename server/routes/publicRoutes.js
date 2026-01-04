import express from "express";
import multer from "multer";
import { analyzeResume } from "../controllers/atsController.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Route: POST /api/public/analyze
router.post("/analyze", upload.single("resume"), analyzeResume);

export default router;


