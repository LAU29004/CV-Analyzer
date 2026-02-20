import { ENABLE_AI } from "../config/env.js";
import { model } from "../config/gemini.js";

/* ─── Safe JSON parser (strips markdown fences) ─── */
const safeParseArray = (text) => {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON array found");
  return JSON.parse(match[0]);
};

/* ─── Hardcoded fallback map ─── */
const baseCerts = {
  "frontend developer": [
    "Meta Front-End Developer",
    "Google UX Design",
    "FreeCodeCamp Responsive Web Design",
  ],
  "backend developer": [
    "Meta Back-End Developer",
    "Node.js Developer Certification",
    "AWS Cloud Practitioner",
  ],
  "full stack developer": [
    "Meta Full-Stack Developer",
    "AWS Developer Associate",
    "Google Cloud Digital Leader",
  ],
  "data analyst": [
    "Google Data Analytics",
    "IBM Data Analyst",
    "Microsoft Power BI",
  ],
  "machine learning engineer": [
    "Google Machine Learning Crash Course",
    "TensorFlow Developer",
    "AWS ML Specialty",
  ],
};

const getFallback = (role, experienceLevel) => {
  const roleKey = role?.toLowerCase() || "full stack developer";
  const list = baseCerts[roleKey] || baseCerts["full stack developer"];
  return list.map((cert) => ({
    name: cert,
    organization: "Various",
    skills: [],
    level: experienceLevel,
    why: "Improves ATS score and validates role-specific skills",
  }));
};

/* ─── Main export ─── */
export async function recommendCertifications({ role, skills = [], experienceLevel = "fresher" }) {
  // If AI is disabled, return hardcoded fallback immediately
  if (ENABLE_AI !== true) {
    console.log("[recommendCertifications] AI disabled – returning hardcoded certs");
    return getFallback(role, experienceLevel);
  }

  const prompt = `
You are an ATS optimization assistant.

Candidate Role: ${role}
Experience Level: ${experienceLevel}
Skills: ${skills.join(", ")}

Task:
Suggest 3–5 relevant professional certifications.

Rules:
- Prefer globally recognised certifications
- Include beginner-friendly certifications if fresher
- Avoid outdated or obscure certifications
- Output ONLY a valid JSON array — no markdown, no backticks, no explanation

Output format (strict):
[
  {
    "name": "Certification full name",
    "organization": "Issuing organisation",
    "skills": ["skill1", "skill2"],
    "level": "Beginner | Intermediate | Advanced",
    "why": "One-sentence reason"
  }
]
`;

  try {
    const result = await model.generateContent(prompt);
    const raw = await result.response.text();
    const parsed = safeParseArray(raw);

    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Empty array");
    return parsed;
  } catch (err) {
    console.warn("[recommendCertifications] Gemini failed, using fallback:", err.message);
    return getFallback(role, experienceLevel);
  }
}