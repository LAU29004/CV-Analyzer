import { ENABLE_AI } from "../config/env.js";
import { model } from "../config/gemini.js";

/* ─── Safe JSON parser (strips markdown fences) ─── */
const safeParseArray = (text) => {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  // grab first [...] block
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON array found in response");

  return JSON.parse(match[0]);
};

/* ─── Hardcoded fallback map ─── */
const CERT_FALLBACKS = {
  "frontend developer": [
    { name: "Meta Front-End Developer Certificate", organization: "Meta / Coursera", skills: ["React", "HTML", "CSS"] },
    { name: "Google UX Design Certificate",         organization: "Google / Coursera", skills: ["UI/UX", "Figma"] },
    { name: "FreeCodeCamp Responsive Web Design",   organization: "freeCodeCamp",      skills: ["HTML", "CSS"] },
  ],
  "backend developer": [
    { name: "Meta Back-End Developer Certificate",  organization: "Meta / Coursera",   skills: ["Node.js", "Python", "REST API"] },
    { name: "AWS Cloud Practitioner",               organization: "Amazon Web Services", skills: ["AWS", "Cloud"] },
    { name: "Node.js Application Developer",        organization: "OpenJS Foundation",  skills: ["Node.js"] },
  ],
  "full stack developer": [
    { name: "Meta Full-Stack Developer Certificate", organization: "Meta / Coursera",   skills: ["React", "Node.js"] },
    { name: "AWS Developer Associate",               organization: "Amazon Web Services", skills: ["AWS", "Cloud"] },
    { name: "Google Cloud Digital Leader",           organization: "Google",             skills: ["Cloud", "GCP"] },
  ],
  "data analyst": [
    { name: "Google Data Analytics Certificate",    organization: "Google / Coursera",  skills: ["SQL", "Python", "Tableau"] },
    { name: "IBM Data Analyst Professional",        organization: "IBM / Coursera",      skills: ["Python", "Excel", "SQL"] },
    { name: "Microsoft Power BI Data Analyst",      organization: "Microsoft",           skills: ["Power BI", "DAX"] },
  ],
  "machine learning engineer": [
    { name: "Google Machine Learning Crash Course", organization: "Google",             skills: ["Python", "TensorFlow"] },
    { name: "TensorFlow Developer Certificate",     organization: "Google",             skills: ["TensorFlow", "Deep Learning"] },
    { name: "AWS Machine Learning Specialty",       organization: "Amazon Web Services", skills: ["AWS", "ML"] },
  ],
};

const getFallback = (role, experienceLevel) => {
  const key = role?.toLowerCase() || "full stack developer";
  const list = CERT_FALLBACKS[key] || CERT_FALLBACKS["full stack developer"];
  return list.map((cert) => ({
    name: cert.name,
    provider: cert.organization,
    level: experienceLevel === "fresher" ? "Beginner" : "Intermediate",
    why: `Recommended based on ${cert.skills.join(", ")} skills`,
  }));
};

/* ─── Main export ─── */
export async function generateCertificateAI({ role, skills = [], experienceLevel = "fresher" }) {
  // If AI is disabled, return hardcoded fallback immediately
  if (ENABLE_AI !== true) {
    console.log("[generateCertificateAI] AI disabled – returning hardcoded certs");
    return getFallback(role, experienceLevel);
  }

  const prompt = `
You are an ATS optimization assistant.

Candidate Role: ${role}
Experience Level: ${experienceLevel}
Skills: ${skills.join(", ")}

Task:
Suggest 3–5 relevant professional certifications for this candidate.

Rules:
- Prefer globally recognised certifications (Google, Meta, AWS, Microsoft, IBM, etc.)
- If experience level is "fresher", prefer beginner-friendly certifications
- Avoid outdated or obscure certifications
- Output ONLY a valid JSON array — no markdown, no explanation, no backticks

Output format (strict):
[
  {
    "name": "Certification full name",
    "provider": "Issuing organisation",
    "level": "Beginner | Intermediate | Advanced",
    "why": "One-sentence reason tailored to candidate skills"
  }
]
`;

  try {
    const result = await model.generateContent(prompt);
    const raw = await result.response.text();
    const parsed = safeParseArray(raw);

    // Validate shape
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Empty array");
    return parsed;
  } catch (err) {
    console.warn("[generateCertificateAI] Gemini failed, using fallback:", err.message);
    return getFallback(role, experienceLevel);
  }
}