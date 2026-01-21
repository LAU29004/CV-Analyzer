import express from "express";
import multer from "multer";
import { analyzeResume } from "../controllers/atsController.js";
import { createResume } from "../controllers/createResume.controller.js";
import { exportStandardResume } from "../controllers/pdfController.js";
import { exportResumeDOCX } from "../controllers/docxController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/analyze", upload.single("resume"), analyzeResume);

// NEW: Generate resume without file upload
router.post("/create-resume", createResume);

router.post("/export-pdf", exportStandardResume);
router.post("/export-docx", exportResumeDOCX);

export default router;
