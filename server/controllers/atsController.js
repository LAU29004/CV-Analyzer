import { createRequire } from "module";
import { model } from "../config/gemini.js";

// Bridge CommonJS modules into ESM
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

export const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { buffer, mimetype, originalname } = req.file;
    let resumeText = "";

    /* -------------------- PDF -------------------- */
    if (mimetype === "application/pdf") {
      const pdfData = await pdfParse(buffer);
      resumeText = pdfData.text;
    }

    /* -------------------- DOCX -------------------- */
    else if (
      mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer });
      resumeText = result.value;
    }

    /* -------------------- Unsupported -------------------- */
    else {
      return res.status(400).json({
        message: "Unsupported file type. Upload PDF or DOCX only",
      });
    }

    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({
        message: "Could not extract text from resume",
      });
    }

    console.log(
      `📄 Resume extracted (${originalname}), length:`,
      resumeText.length
    );

    /* -------------------- GEMINI PROMPT -------------------- */
    const prompt = `
You are an expert ATS (Applicant Tracking System) resume analyzer. Analyze the following resume and provide a comprehensive evaluation.

Resume Text:
${resumeText}

Provide your analysis in the following JSON format:
{
  "overallScore": <number between 0-100>,
  "issuesCount": <number>,
  "sections": {
    "content": <score 0-100>,
    "sections": <score 0-100>,
    "atsEssentials": <score 0-100>,
    "tailoring": <score 0-100>
  },
  "analysis": {
    "strengths": [
      "Minimum 3 strengths"
    ],
    "weaknesses": [
      "Minimum 3 weaknesses with improvement suggestions"
    ]
  }
}

Evaluate based on:
- Content quality
- Proper section organization
- ATS compatibility
- Job market tailoring
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    console.log("🤖 Gemini response received");

    /* -------------------- JSON PARSE -------------------- */
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (err) {
      console.error("❌ JSON Parse Error");
      console.error(responseText);
      return res.status(500).json({
        error: "AI returned invalid JSON",
        rawResponse: responseText,
      });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("❌ Resume Analysis Error:", error);

    if (error.message?.includes("API key")) {
      return res.status(401).json({
        error: "Invalid Gemini API key",
      });
    }

    res.status(500).json({
      error: "Failed to analyze resume",
      details: error.message,
    });
  }
};
