import { getResumeSummaries } from "../services/summaryService.js";


export const SummaryGenerator=async (req, res) => {
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
}