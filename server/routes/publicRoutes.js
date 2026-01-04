import express from "express";
import multer from "multer";
import { analyzeResume } from "../controllers/atsController.js";
import { exportResumePDF } from "../controllers/pdfController.js";
import { exportResumeDOCX } from "../controllers/docxController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/analyze", upload.single("resume"), analyzeResume);
router.post("/export-pdf", exportResumePDF);
router.post("/export-docx", exportResumeDOCX)

export default router;
