import { createRequire } from "module";
import { model } from "../config/gemini.js";
import mammoth from "mammoth";

const require = createRequire(import.meta.url);

// pdf-parse v2 exports a CLASS
const { PDFParse } = require("pdf-parse");

// Retry helper function
const retry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1 || !error.message.includes('503')) throw error;
      console.log(`Attempt ${i + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
};

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
  {
  "optimizedResume": {
    "header": {
      "name": "",
      "email": "",
      "phone": "",
      "linkedin": "",
      "location": "" // ATS often filters by city/state
    },
    "summary": "", // Include measurable "career highlights" here
    "skills": {
      "technical": [], // Hard skills like "Node.js"
      "soft": []       // Behavior skills like "Leadership"
    },
    "experience": [
      {
        "role": "",
        "company": "",
        "duration": "",
        "location": "",
        "bullets": [] // Each bullet must follow the Action + Result format
      }
    ],
    "education": [
      {
        "institution": "",
        "degree": "",
        "duration": "",
        "gpa": "",       // Optional but good for students
        "highlights": [] // Academic awards or honors
      }
    ],
    "projects": [
      {
        "title": "",
        "technologies": "",
        "bullets": []    // Focused on your specific contribution
      }
    ],
    "certifications_awards": [] // Critical for high-level screening
  }
}
}

Resume Text:
<<<
${resumeText}
>>>
`;

    const result = await retry(() => model.generateContent(prompt));
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
