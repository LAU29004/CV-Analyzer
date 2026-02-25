import express from "express";
import multer from "multer";
import { analyzeResume } from "../controllers/atsController.js";
import { createResume } from "../controllers/createResume.controller.js";
import { exportResumePDF } from "../controllers/pdfController.js";
import { exportResumeDOCX } from "../controllers/docxController.js";
import { getResumeSummaries } from "../services/summaryService.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ─────────────────────────────
// Existing routes
// ─────────────────────────────
router.post("/analyze", upload.single("resume"), analyzeResume);
router.post("/create-resume", createResume);
router.post("/export-pdf", exportResumePDF);
router.post("/export-docx", exportResumeDOCX);

// ─────────────────────────────
// NEW: Summary generator route
// POST /api/public/resume/summaries
// ─────────────────────────────
router.post("/summaries", async (req, res) => {
  try {
    const {
      useAI,
      role,
      skills,
      experienceCount = 0,
      education = [],
    } = req.body;

    if (!role || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({
        success: false,
        message: "role and skills are required",
      });
    }

    const summaries = await getResumeSummaries({
      useAI,
      role,
      skills,
      experienceCount,
      education,
    });

    return res.json({
      success: true,
      summaries, // always array of 3
    });
  } catch (error) {
    console.error("Summary generation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate summaries",
    });
  }
});

export default router;