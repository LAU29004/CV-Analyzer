import { createRequire } from "module";
import mammoth from "mammoth";
import { ENABLE_AI } from "../config/env.js";
import { safeAI } from "../utils/safeAI.js";
import { retry } from "../utils/retry.js";
import { model } from "../config/gemini.js";

const safeParseJSON = (text) => {
  try {
    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // Extract first JSON object only
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found");

    return JSON.parse(match[0]);
  } catch (err) {
    console.error("❌ AI JSON Parse Failed");
    console.error(text);
    throw err;
  }
};

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

/* ================= LOGGER ================= */
const logAI = (message, meta = {}) => {
  console.log(`[AI][ATS] ${message}`, meta);
};

/* ================= HELPERS ================= */
const textIncludes = (text, patterns = []) =>
  patterns.some((p) => new RegExp(p, "i").test(text));

/* ================= ATS SCORE ================= */
const calculateATSScore = (resume, rawText = "") => {
  const breakdown = {
    contact: 0,
    sections: 0,
    keywords: 0,
    readability: 15,
    formatting: 10
  };

  const missing = [];

  /* ---- CONTACT ---- */
  if (
    resume.header?.email ||
    textIncludes(rawText, ["@gmail", "@outlook", "@yahoo"])
  ) breakdown.contact += 5;

  if (
    resume.header?.linkedin ||
    textIncludes(rawText, ["linkedin\\.com"])
  ) breakdown.contact += 3;
  else missing.push("Missing LinkedIn");

  if (
    resume.header?.github ||
    textIncludes(rawText, ["github\\.com"])
  ) breakdown.contact += 2;
  else missing.push("Missing GitHub");

  /* ---- SECTIONS ---- */
  if (textIncludes(rawText, ["summary", "profile"])) breakdown.sections += 5;
  if (textIncludes(rawText, ["skills", "technical skills"])) breakdown.sections += 5;
  if (textIncludes(rawText, ["experience", "intern"])) breakdown.sections += 5;

  /* ---- KEYWORDS (DOMAIN AGNOSTIC) ---- */
  const keywordHits =
    resume.skills?.technical?.length ||
    (rawText.match(
      /React|Python|Java|C\+\+|SolidWorks|AutoCAD|ANSYS|PLC|IoT|SQL|Linux|Finance|Marketing|Design/gi
    ) || []).length;

  if (keywordHits >= 8) breakdown.keywords = 25;
  else if (keywordHits >= 4) breakdown.keywords = 15;
  else missing.push("Low keyword density");

  const total =
    breakdown.contact +
    breakdown.sections +
    breakdown.keywords +
    breakdown.readability +
    breakdown.formatting;

  return {
    overall: Math.min(total, 100),
    breakdown,
    missing
  };
};

/* ================= CONTROLLER ================= */
export const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No resume uploaded" });
    }

    /* ---------- EXTRACT TEXT ---------- */
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
      return res.status(400).json({ error: "Empty resume text" });
    }

    /* ---------- SAFE BASE ---------- */
    const baseOptimizedResume = {
      header: {},
      summary: "",
      skills: { technical: [], soft: [] },
      experience: [],
      projects: [],
      education: [],
      certifications_awards: []
    };

    const fallback = {
      analysis: {
        strengths: ["Resume text extracted successfully"],
        weaknesses: ["AI optimization skipped or unavailable"]
      },
      optimizedResume: baseOptimizedResume,
      atsScore: calculateATSScore(baseOptimizedResume, resumeText)
    };

    /* ---------- AI TOGGLE ---------- */
    const aiAllowed = ENABLE_AI === true;
    logAI("AI enabled", { aiAllowed });

    const finalResponse = aiAllowed
      ? await safeAI(
          async () => {
            const prompt = `
You are an ATS resume analyzer.

RULES:
- DO NOT invent experience or projects
- Preserve domain (mechanical, civil, management, software, etc.)
- Extract skills, experience, education if present
- STRICT JSON ONLY

FORMAT:
{
  "analysis": { "strengths": [], "weaknesses": [] },
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
let parsed;

try {
  parsed = safeParseJSON(raw);
} catch (err) {
  return fallback;
}


            const mergedResume = {
              ...baseOptimizedResume,
              ...parsed.optimizedResume,
              skills: {
                technical:
                  parsed.optimizedResume.skills?.technical || [],
                soft:
                  parsed.optimizedResume.skills?.soft || []
              }
            };

            return {
              analysis: parsed.analysis || fallback.analysis,
              optimizedResume: mergedResume,
              atsScore: calculateATSScore(mergedResume, resumeText)
            };
          },
          () => fallback
        )
      : fallback;

    return res.json(finalResponse);
  } catch (err) {
    console.error("ATS ERROR:", err);
    return res.status(500).json({ error: "Resume analysis failed" });
  }
};
