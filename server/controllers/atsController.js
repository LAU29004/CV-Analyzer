import { createRequire } from "module";
import { model } from "../config/gemini.js";
import mammoth from "mammoth";

const require = createRequire(import.meta.url);

// pdf-parse v2 exports a CLASS
const { PDFParse } = require("pdf-parse");

export const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No resume uploaded" });
    }

    const { buffer, mimetype, originalname } = req.file;
    let resumeText = "";

    /* ---------- PDF ---------- */
    if (mimetype === "application/pdf") {
      const parser = new PDFParse({ data: buffer });
      const pdfData = await parser.getText();
      await parser.destroy();
      resumeText = pdfData.text;
    }

    /* ---------- DOCX ---------- */
    else if (
      mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer });
      resumeText = result.value;
    }

    /* ---------- Unsupported ---------- */
    else {
      return res.status(400).json({
        error: "Only PDF or DOCX files are allowed",
      });
    }

    if (!resumeText.trim()) {
      return res.status(400).json({
        error: "Failed to extract resume text",
      });
    }

    console.log(`Resume extracted: ${originalname}`);

    /* ---------- GEMINI PROMPT ---------- */
    const prompt = `
You are an expert ATS resume writer.

TASKS:
1. Analyze the resume
2. Identify strengths and weaknesses
3. Rewrite the resume into ATS-optimized professional format
4. Improve bullet points using action verbs
5. Organize content into a clean resume structure

RULES:
- Return STRICT JSON ONLY
- No markdown
- No explanations

JSON FORMAT:
{
  "analysis": {
    "overallScore": 0-100,
    "issuesCount": number,
    "strengths": ["min 3"],
    "weaknesses": ["min 3 with fixes"]
  },
  "optimizedResume": {
    "header": {
      "name": "",
      "email": "",
      "phone": "",
      "linkedin": ""
    },
    "summary": "",
    "skills": {
      "technical": [],
      "soft": []
    },
    "experience": [
      {
        "role": "",
        "company": "",
        "duration": "",
        "bullets": []
      }
    ],
    "education": [],
    "projects": []
  }
}

Resume Text:
<<<
${resumeText}
>>>
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = await response.text();

    /* ---------- CLEAN & PARSE JSON ---------- */
    let data;
    try {
      const cleaned = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      data = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({
        error: "Invalid AI JSON output",
        rawResponse: responseText,
      });
    }

    res.status(200).json(data);

  } catch (error) {
    console.error("Resume Analysis Error:", error);
    res.status(500).json({
      error: "Resume analysis failed",
      details: error.message,
    });
  }
};
