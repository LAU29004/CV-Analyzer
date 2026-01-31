import { createRequire } from "module";
import mammoth from "mammoth";
import { ENABLE_AI } from "../config/env.js";
import { safeAI } from "../utils/safeAI.js";
import { retry } from "../utils/retry.js";
import { model } from "../config/gemini.js";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

/* ================= AI DEBUG LOGGER ================= */
const logAI = (message, meta = {}) => {
  console.log(`[AI][ANALYZE] ${message}`, meta);
};
/* ================================================== */

/* ---------- HEADER EXTRACTOR (NON-AI, SAFE) ---------- */
const extractHeaderFromText = (text) => {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return {
    name: lines[0] || "",
    email: lines.find((l) => l.includes("@")) || "",
    phone: lines.find((l) => /\+?\d[\d\s-]{8,}/.test(l)) || "",
    linkedin: lines.find((l) =>
      l.toLowerCase().includes("linkedin")
    ) || "",
    github: lines.find((l) =>
      l.toLowerCase().includes("github")
    ) || "",
    location: ""
  };
};
/* --------------------------------------------------- */

export const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No resume uploaded" });
    }

    /* ---------- TEXT EXTRACTION ---------- */
    let resumeText = "";

    if (req.file.mimetype === "application/pdf") {
      const parser = new PDFParse({ data: req.file.buffer });
      const pdf = await parser.getText();
      await parser.destroy();
      resumeText = pdf.text;
    } else {
      const result = await mammoth.extractRawText({
        buffer: req.file.buffer
      });
      resumeText = result.value;
    }

    if (!resumeText.trim()) {
      return res.status(400).json({
        error: "Failed to extract resume text"
      });
    }

    /* ---------- BASE RESUME (SAFE FALLBACK) ---------- */
    const baseOptimizedResume = {
      header: extractHeaderFromText(resumeText),
      summary: "",
      skills: {
        technical: [],
        soft: []
      },
      experience: [],
      projects: [],
      education: [],
      certifications_awards: []
    };

    const fallbackResponse = {
      analysis: {
        strengths: ["Resume text extracted successfully"],
        weaknesses: ["AI optimization skipped or unavailable"]
      },
      optimizedResume: baseOptimizedResume
    };

    /* ---------- AI TOGGLE ---------- */
    const aiAllowed = ENABLE_AI === true;
    logAI("AI decision evaluated", { ENABLE_AI, aiAllowed });

    const finalResponse = aiAllowed
      ? await safeAI(
          async () => {
            logAI("Calling Gemini API for resume analysis");

            const prompt = `
You are an ATS resume parser and optimizer.

RULES:
- Improve wording and structure ONLY
- Do NOT invent experience, education, or projects
- Do NOT remove real content
- STRICT JSON ONLY

JSON FORMAT:
{
  "analysis": {
    "strengths": ["string"],
    "weaknesses": ["string"]
  },
  "optimizedResume": {
    "header": {},
    "summary": "",
    "skills": { "technical": [], "soft": [] },
    "experience": [],
    "projects": [],
    "education": [],
    "certifications_awards": []
  }
}

RESUME TEXT:
<<<
${resumeText}
>>>
`;

            const result = await retry(() =>
              model.generateContent(prompt)
            );

            const raw = await result.response.text();
            const cleaned = raw.replace(/```json|```/g, "").trim();
            const parsed = JSON.parse(cleaned);

            if (!parsed.optimizedResume) {
              throw new Error("optimizedResume missing");
            }

            logAI("AI resume analysis successful");

            return {
              analysis: parsed.analysis || fallbackResponse.analysis,
              optimizedResume: {
                ...baseOptimizedResume,
                ...parsed.optimizedResume,
                header: {
                  ...baseOptimizedResume.header,
                  ...(parsed.optimizedResume.header || {})
                }
              }
            };
          },
          () => {
            logAI("AI failed; using fallback");
            return fallbackResponse;
          }
        )
      : (() => {
          logAI("AI disabled via configuration");
          return fallbackResponse;
        })();

    return res.json(finalResponse);
  } catch (err) {
    console.error("Resume Analysis Error:", err);
    return res.status(500).json({
      error: "Resume analysis failed"
    });
  }
};
