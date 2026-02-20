// import { createRequire } from "module";
// import mammoth from "mammoth";
// import { ENABLE_AI } from "../config/env.js";
// import { safeAI } from "../utils/safeAI.js";
// import { retry } from "../utils/retry.js";
// import { model } from "../config/gemini.js";

// const safeParseJSON = (text) => {
//   try {
//     const cleaned = text
//       .replace(/```json/gi, "")
//       .replace(/```/g, "")
//       .trim();

//     // Extract first JSON object only
//     const match = cleaned.match(/\{[\s\S]*\}/);
//     if (!match) throw new Error("No JSON found");

//     return JSON.parse(match[0]);
//   } catch (err) {
//     console.error("❌ AI JSON Parse Failed");
//     console.error(text);
//     throw err;
//   }
// };

// const require = createRequire(import.meta.url);
// const { PDFParse } = require("pdf-parse");

// /* ================= LOGGER ================= */
// const logAI = (message, meta = {}) => {
//   console.log(`[AI][ATS] ${message}`, meta);
// };

// /* ================= HELPERS ================= */
// const textIncludes = (text, patterns = []) =>
//   patterns.some((p) => new RegExp(p, "i").test(text));

// /* ================= ATS SCORE ================= */
// const calculateATSScore = (resume, rawText = "") => {
//   const breakdown = {
//     contact: 0,
//     sections: 0,
//     keywords: 0,
//     readability: 15,
//     formatting: 10
//   };

//   const missing = [];

//   /* ---- CONTACT ---- */
//   if (
//     resume.header?.email ||
//     textIncludes(rawText, ["@gmail", "@outlook", "@yahoo"])
//   ) breakdown.contact += 5;

//   if (
//     resume.header?.linkedin ||
//     textIncludes(rawText, ["linkedin\\.com"])
//   ) breakdown.contact += 3;
//   else missing.push("Missing LinkedIn");

//   if (
//     resume.header?.github ||
//     textIncludes(rawText, ["github\\.com"])
//   ) breakdown.contact += 2;
//   else missing.push("Missing GitHub");

//   /* ---- SECTIONS ---- */
//   if (textIncludes(rawText, ["summary", "profile"])) breakdown.sections += 5;
//   if (textIncludes(rawText, ["skills", "technical skills"])) breakdown.sections += 5;
//   if (textIncludes(rawText, ["experience", "intern"])) breakdown.sections += 5;

//   /* ---- KEYWORDS (DOMAIN AGNOSTIC) ---- */
//   const keywordHits =
//     resume.skills?.technical?.length ||
//     (rawText.match(
//       /React|Python|Java|C\+\+|SolidWorks|AutoCAD|ANSYS|PLC|IoT|SQL|Linux|Finance|Marketing|Design/gi
//     ) || []).length;

//   if (keywordHits >= 8) breakdown.keywords = 25;
//   else if (keywordHits >= 4) breakdown.keywords = 15;
//   else missing.push("Low keyword density");

//   const total =
//     breakdown.contact +
//     breakdown.sections +
//     breakdown.keywords +
//     breakdown.readability +
//     breakdown.formatting;

//   return {
//     overall: Math.min(total, 100),
//     breakdown,
//     missing
//   };
// };

// /* ================= CONTROLLER ================= */
// export const analyzeResume = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "No resume uploaded" });
//     }

//     /* ---------- EXTRACT TEXT ---------- */
//     let resumeText = "";

//     if (req.file.mimetype === "application/pdf") {
//       const parser = new PDFParse({ data: req.file.buffer });
//       const pdf = await parser.getText();
//       await parser.destroy();
//       resumeText = pdf.text;
//     } else {
//       const result = await mammoth.extractRawText({
//         buffer: req.file.buffer
//       });
//       resumeText = result.value;
//     }

//     if (!resumeText.trim()) {
//       return res.status(400).json({ error: "Empty resume text" });
//     }

//     /* ---------- SAFE BASE ---------- */
//     const baseOptimizedResume = {
//       header: {},
//       summary: "",
//       skills: { technical: [], soft: [] },
//       experience: [],
//       projects: [],
//       education: [],
//       certifications_awards: []
//     };

//     const fallback = {
//       analysis: {
//         strengths: ["Resume text extracted successfully"],
//         weaknesses: ["AI optimization skipped or unavailable"]
//       },
//       optimizedResume: baseOptimizedResume,
//       atsScore: calculateATSScore(baseOptimizedResume, resumeText)
//     };

//     /* ---------- AI TOGGLE ---------- */
//     const aiAllowed = ENABLE_AI === true;
//     logAI("AI enabled", { aiAllowed });

//     const finalResponse = aiAllowed
//       ? await safeAI(
//           async () => {
//             const prompt = `
// You are an ATS resume analyzer.

// RULES:
// - DO NOT invent experience or projects
// - Preserve domain (mechanical, civil, management, software, etc.)
// - Extract skills, experience, education if present
// - STRICT JSON ONLY

// FORMAT:
// {
//   "analysis": { "strengths": [], "weaknesses": [] },
//   "optimizedResume": {
//     "header": {},
//     "summary": "",
//     "skills": { "technical": [], "soft": [] },
//     "experience": [],
//     "projects": [],
//     "education": [],
//     "certifications_awards": []
//   }
// }

// RESUME TEXT:
// <<<
// ${resumeText}
// >>>
// `;

//             const result = await retry(() =>
//               model.generateContent(prompt)
//             );

//             const raw = await result.response.text();
// let parsed;

// try {
//   parsed = safeParseJSON(raw);
// } catch (err) {
//   return fallback;
// }


//             const mergedResume = {
//               ...baseOptimizedResume,
//               ...parsed.optimizedResume,
//               skills: {
//                 technical:
//                   parsed.optimizedResume.skills?.technical || [],
//                 soft:
//                   parsed.optimizedResume.skills?.soft || []
//               }
//             };

//             return {
//               analysis: parsed.analysis || fallback.analysis,
//               optimizedResume: mergedResume,
//               atsScore: calculateATSScore(mergedResume, resumeText)
//             };
//           },
//           () => fallback
//         )
//       : fallback;

//     return res.json(finalResponse);
//   } catch (err) {
//     console.error("ATS ERROR:", err);
//     return res.status(500).json({ error: "Resume analysis failed" });
//   }
// };


import { createRequire } from "module";
import mammoth from "mammoth";
import { ENABLE_AI } from "../config/env.js";
import { safeAI } from "../utils/safeAI.js";
import { retry } from "../utils/retry.js";
import { model } from "../config/gemini.js";
import { recommendCertifications } from "../services/certificationRecommender.js";
import { generateCertificateAI } from "../services/generateCertificateAI.js";

/* ================= JSON SAFE PARSERS ================= */

/** Parses a JSON *object* from a raw LLM string */
const safeParseJSON = (text) => {
  try {
    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON object found");
    return JSON.parse(match[0]);
  } catch (err) {
    console.error("❌ AI JSON (object) Parse Failed");
    console.error(text);
    throw err;
  }
};

/** Parses a JSON *array* from a raw LLM string */
const safeParseArray = (text) => {
  try {
    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON array found");
    return JSON.parse(match[0]);
  } catch (err) {
    console.error("❌ AI JSON (array) Parse Failed");
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

/* ================= ROLE + EXPERIENCE INFERENCE ================= */
const inferRoleAndExperience = (resume, rawText) => {
  let role = "Full Stack Developer";
  let experienceLevel = "fresher";

  const text = rawText.toLowerCase();

  if (textIncludes(text, ["frontend", "react", "ui"])) {
    role = "Frontend Developer";
  } else if (textIncludes(text, ["backend", "node", "api"])) {
    role = "Backend Developer";
  } else if (textIncludes(text, ["data analyst", "power bi", "sql"])) {
    role = "Data Analyst";
  } else if (textIncludes(text, ["machine learning", "deep learning"])) {
    role = "Machine Learning Engineer";
  }

  if (textIncludes(text, ["2 years", "3 years", "experienced", "senior"])) {
    experienceLevel = "intermediate";
  }

  return { role, experienceLevel };
};

/* ================= ATS SCORE ================= */
const calculateATSScore = (resume, rawText = "") => {
  const breakdown = {
    contact: 0,
    sections: 0,
    keywords: 0,
    readability: 15,
    formatting: 10,
  };

  const missing = [];

  if (
    resume.header?.email ||
    textIncludes(rawText, ["@gmail", "@outlook", "@yahoo"])
  )
    breakdown.contact += 5;

  if (
    resume.header?.linkedin ||
    textIncludes(rawText, ["linkedin\\.com"])
  )
    breakdown.contact += 3;
  else missing.push("Missing LinkedIn");

  if (
    resume.header?.github ||
    textIncludes(rawText, ["github\\.com"])
  )
    breakdown.contact += 2;
  else missing.push("Missing GitHub");

  if (textIncludes(rawText, ["summary", "profile"])) breakdown.sections += 5;
  if (textIncludes(rawText, ["skills", "technical skills"])) breakdown.sections += 5;
  if (textIncludes(rawText, ["experience", "intern"])) breakdown.sections += 5;

  const keywordHits =
    resume.skills?.technical?.length ||
    (
      rawText.match(
        /React|Python|Java|C\+\+|SQL|Node|AWS|Docker|Linux|Power BI|ML/gi
      ) || []
    ).length;

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
    missing,
  };
};

/* ================= HARDCODED PROJECT FALLBACKS ================= */
const PROJECT_FALLBACKS = {
  "frontend developer": [
    {
      title: "Portfolio Website",
      bullets: [
        "Built a responsive personal portfolio using React and Tailwind CSS",
        "Implemented dark/light mode toggle with persistent localStorage state",
        "Deployed on Vercel with CI/CD via GitHub Actions",
      ],
    },
    {
      title: "Todo / Task Manager App",
      bullets: [
        "Developed a drag-and-drop task manager using React DnD",
        "Added local persistence with IndexedDB",
        "Implemented priority filtering and due-date reminders",
      ],
    },
  ],
  "backend developer": [
    {
      title: "RESTful Blog API",
      bullets: [
        "Built a REST API using Node.js and Express with JWT authentication",
        "Designed a MongoDB schema for posts, comments, and user roles",
        "Added rate limiting and input sanitisation middleware",
      ],
    },
    {
      title: "URL Shortener Service",
      bullets: [
        "Created a URL shortener with Redis-based caching for fast redirects",
        "Exposed analytics endpoint for click-count and referrer tracking",
        "Containerised with Docker and deployed on AWS EC2",
      ],
    },
  ],
  "full stack developer": [
    {
      title: "E-Commerce Platform",
      bullets: [
        "Built a full-stack store with React frontend and Node.js/Express backend",
        "Integrated Stripe for payments and Cloudinary for image uploads",
        "Implemented role-based access control for admin and customer accounts",
      ],
    },
    {
      title: "Real-Time Chat App",
      bullets: [
        "Developed a chat application using Socket.io and React",
        "Added room-based messaging, online presence indicators, and typing notifications",
        "Persisted chat history in MongoDB with pagination support",
      ],
    },
  ],
  "data analyst": [
    {
      title: "Sales Dashboard (Power BI / Tableau)",
      bullets: [
        "Created interactive KPI dashboards visualising monthly revenue trends",
        "Connected to SQL Server data warehouse using DirectQuery mode",
        "Automated report refresh schedule and distributed via Power BI Service",
      ],
    },
    {
      title: "Customer Churn Prediction",
      bullets: [
        "Performed EDA on 50 k-row telecom dataset using Python and Pandas",
        "Built a logistic regression model with 84% accuracy using scikit-learn",
        "Presented findings with Matplotlib/Seaborn charts in a Jupyter notebook",
      ],
    },
  ],
  "machine learning engineer": [
    {
      title: "Image Classification CNN",
      bullets: [
        "Trained a convolutional neural network on CIFAR-10 achieving 91% test accuracy",
        "Applied data augmentation and dropout regularisation to prevent overfitting",
        "Exported model as TensorFlow SavedModel and served via Flask API",
      ],
    },
    {
      title: "Sentiment Analysis API",
      bullets: [
        "Fine-tuned a BERT-based model on IMDB reviews for binary sentiment classification",
        "Wrapped inference in a FastAPI endpoint with async request handling",
        "Containerised with Docker and deployed on Google Cloud Run",
      ],
    },
  ],
};

const getProjectFallback = (role) => {
  const key = role?.toLowerCase() || "full stack developer";
  return (
    PROJECT_FALLBACKS[key] ||
    PROJECT_FALLBACKS["full stack developer"]
  );
};

/* ================= AI PROJECT SUGGESTIONS ================= */
/**
 * Generates 2–3 project suggestions via Gemini when AI is enabled.
 * Falls back to hardcoded suggestions on any failure.
 */
const generateProjectSuggestions = async ({ role, skills = [], experienceLevel = "fresher" }) => {
  if (ENABLE_AI !== true) {
    logAI("AI disabled – returning hardcoded project suggestions");
    return getProjectFallback(role);
  }

  const prompt = `
You are a career advisor helping a ${experienceLevel} ${role} build a strong resume.

Skills they know: ${skills.join(", ")}

Task:
Suggest 2–3 portfolio projects they can build to strengthen their resume.

Rules:
- Projects must be realistic for a ${experienceLevel}
- Each project should use at least one of their existing skills
- Bullet points should be achievement-oriented (action verb + metric/outcome)
- Output ONLY a valid JSON array — no markdown, no backticks, no explanation

Output format (strict):
[
  {
    "title": "Project name",
    "bullets": [
      "Bullet 1 describing a feature or achievement",
      "Bullet 2 describing a technical decision or result",
      "Bullet 3 describing deployment or impact"
    ]
  }
]
`;

  try {
    const result = await retry(() => model.generateContent(prompt));
    const raw = await result.response.text();
    const parsed = safeParseArray(raw);

    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Empty array");
    logAI("Project suggestions generated via Gemini", { count: parsed.length });
    return parsed;
  } catch (err) {
    console.warn("[generateProjectSuggestions] Gemini failed, using fallback:", err.message);
    return getProjectFallback(role);
  }
};

/* ================= CONTROLLER ================= */
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
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      resumeText = result.value;
    }

    if (!resumeText.trim()) {
      return res.status(400).json({ error: "Empty resume text" });
    }

    /* ---------- BASE STRUCTURE ---------- */
    const baseOptimizedResume = {
      header: {},
      summary: "",
      skills: { technical: [], soft: [] },
      experience: [],
      projects: [],
      education: [],
      certifications_awards: [],
    };

    const fallback = {
      analysis: {
        strengths: ["Resume text extracted successfully"],
        weaknesses: ["AI optimization skipped or unavailable"],
      },
      optimizedResume: baseOptimizedResume,
      atsScore: calculateATSScore(baseOptimizedResume, resumeText),
      certificationSuggestions: [],
    };

    const aiAllowed = ENABLE_AI === true;
    logAI("AI enabled", { aiAllowed });

    const finalResponse = aiAllowed
      ? await safeAI(
          async () => {
            const prompt = `
You are an ATS resume analyzer.

RULES:
- DO NOT invent experience or projects
- Preserve candidate domain
- STRICT JSON ONLY

FORMAT:
{
  "analysis": {
    "strengths": ["List 3 key strengths"],
    "weaknesses": ["List 3-5 specific, actionable suggestions to improve content, impact, or clarity"]
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

            const result = await retry(() => model.generateContent(prompt));
            const raw = await result.response.text();
            let parsed;

            try {
              parsed = safeParseJSON(raw);
            } catch {
              return fallback;
            }

            const mergedResume = {
              ...baseOptimizedResume,
              ...parsed.optimizedResume,
              skills: {
                technical: parsed.optimizedResume.skills?.technical || [],
                soft: parsed.optimizedResume.skills?.soft || [],
              },
            };

            const atsScore = calculateATSScore(mergedResume, resumeText);
            const { role, experienceLevel } = inferRoleAndExperience(mergedResume, resumeText);

            // ── Certifications via Gemini ──
            const rawCerts = await generateCertificateAI({
              role,
              skills: mergedResume.skills.technical,
              experienceLevel,
            });

            const certificationSuggestions = rawCerts.map((cert) => ({
              name: cert.name,
              provider: cert.provider || cert.organization || "Various",
              level: cert.level || (experienceLevel === "fresher" ? "Beginner" : "Advanced"),
              why: cert.why || `Recommended based on your ${role} profile`,
            }));

            return {
              analysis: parsed.analysis || fallback.analysis,
              optimizedResume: mergedResume,
              atsScore,
              certificationSuggestions,
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

/* ================= BEGINNER RESUME CONTROLLER ================= */
/**
 * Called by POST /api/public/create-resume
 * Receives structured form data, generates resume + project suggestions + certs.
 */
export const createResume = async (req, res) => {
  try {
    const {
      full_name,
      role,
      email,
      phone,
      location,
      linkedin,
      github,
      skills = [],
      softSkills = [],
      experience = [],
      projects = [],
      education = [],
      certifications = [],
      useAI,
      jobDescription,
    } = req.body;

    if (!full_name || !email || !role) {
      return res.status(400).json({ error: "full_name, email, and role are required" });
    }

    const aiAllowed = ENABLE_AI === true;
    logAI("Beginner flow – AI enabled", { aiAllowed });

    /* ---------- Build base optimizedResume from form data ---------- */
    const baseOptimizedResume = {
      header: {
        name: full_name,
        email,
        phone: phone || undefined,
        location: location || undefined,
        linkedin: linkedin || undefined,
        github: github || undefined,
      },
      summary: "",
      skills: {
        technical: Array.isArray(skills) ? skills : [],
        soft: Array.isArray(softSkills) ? softSkills : [],
      },
      experience,
      projects,
      education,
      certifications_awards: certifications,
    };

    /* ---------- Infer role context for suggestions ---------- */
    // Use the submitted role directly for suggestion context
    const normalizedRole = role.toLowerCase();
    let inferredRole = "Full Stack Developer";
    if (/frontend|react|ui|ux/.test(normalizedRole)) inferredRole = "Frontend Developer";
    else if (/backend|node|api|server/.test(normalizedRole)) inferredRole = "Backend Developer";
    else if (/data analyst|analyst|bi|sql/.test(normalizedRole)) inferredRole = "Data Analyst";
    else if (/machine learning|ml|ai|deep learning/.test(normalizedRole)) inferredRole = "Machine Learning Engineer";
    else if (/full.?stack/.test(normalizedRole)) inferredRole = "Full Stack Developer";

    const experienceLevel = experience.length > 0 ? "intermediate" : "fresher";

    /* ---------- AI-enhanced summary (when AI enabled) ---------- */
    let optimizedResume = { ...baseOptimizedResume };

    if (aiAllowed) {
      try {
        const summaryPrompt = `
You are a professional resume writer.

Candidate: ${full_name}
Role: ${role}
Skills: ${skills.join(", ")}
Experience: ${experience.length > 0 ? JSON.stringify(experience) : "Fresher / No work experience"}
${jobDescription ? `Job Description:\n${jobDescription}` : ""}

Write a 2–3 sentence professional summary for this candidate's resume.
Output ONLY the summary text — no labels, no markdown, no quotes.
`;
        const summaryResult = await retry(() => model.generateContent(summaryPrompt));
        const summaryText = (await summaryResult.response.text()).trim();
        if (summaryText) optimizedResume.summary = summaryText;
      } catch (err) {
        console.warn("[createResume] Summary generation failed:", err.message);
      }
    }

    /* ---------- ATS Score ---------- */
    // Build a combined text blob for scoring
    const rawText = [
      full_name, role, email, linkedin, github,
      ...skills, ...softSkills,
      ...experience.map((e) => `${e.role} ${e.company}`),
      ...projects.map((p) => p.title),
      ...education.map((e) => `${e.institution} ${e.degree || ""}`),
    ].join(" ");

    const atsScore = calculateATSScore(optimizedResume, rawText);

    /* ---------- Project Suggestions (AI or fallback) ---------- */
    const projectSuggestions = await generateProjectSuggestions({
      role: inferredRole,
      skills: optimizedResume.skills.technical,
      experienceLevel,
    });

    /* ---------- Certification Recommendations (AI or fallback) ---------- */
    const rawCerts = await generateCertificateAI({
      role: inferredRole,
      skills: optimizedResume.skills.technical,
      experienceLevel,
    });

    const certificationsRecommended = rawCerts.map((cert) => ({
      name: cert.name,
      provider: cert.provider || cert.organization || "Various",
      level: cert.level || (experienceLevel === "fresher" ? "Beginner" : "Intermediate"),
      why: cert.why || `Recommended based on your ${inferredRole} profile`,
    }));

    return res.json({
      optimizedResume,
      atsScore,
      projectSuggestions,
      certificationsRecommended,
    });
  } catch (err) {
    console.error("CREATE RESUME ERROR:", err);
    return res.status(500).json({ error: "Resume creation failed" });
  }
};