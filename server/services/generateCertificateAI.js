import { ENABLE_AI } from "../config/env.js";
import { model } from "../config/gemini.js";
import Certificate from "../models/Certificate.js";
import {
  getRecommendedCertificatesForRole,
  mapRoleToDomain,
} from "./certificateDataService.js";

/**
 * Enrich AI-generated cert objects with `link` from the DB.
 * Tries exact name match first, then case-insensitive partial match.
 */
const enrichWithLinks = async (aiCerts) => {
  return Promise.all(
    aiCerts.map(async (cert) => {
      try {
        // Exact match
        let dbDoc = await Certificate.findOne({ name: cert.name }).lean();
        // Partial / case-insensitive match as fallback
        if (!dbDoc) {
          dbDoc = await Certificate.findOne({
            name: { $regex: cert.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" },
          }).lean();
        }
        return { ...cert, link: dbDoc?.link || "" };
      } catch {
        return { ...cert, link: "" };
      }
    })
  );
};

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

/* ─── Hardcoded fallback map (last resort if DB is also empty) ─── */
const CERT_FALLBACKS = {
  "frontend developer": [
    { name: "Meta Front-End Developer Certificate", organization: "Meta / Coursera", skills: ["React", "HTML", "CSS"] },
    { name: "Google UX Design Certificate", organization: "Google / Coursera", skills: ["UI/UX", "Figma"] },
    { name: "FreeCodeCamp Responsive Web Design", organization: "freeCodeCamp", skills: ["HTML", "CSS"] },
  ],
  "backend developer": [
    { name: "Meta Back-End Developer Certificate", organization: "Meta / Coursera", skills: ["Node.js", "Python", "REST API"] },
    { name: "AWS Cloud Practitioner", organization: "Amazon Web Services", skills: ["AWS", "Cloud"] },
    { name: "Node.js Application Developer", organization: "OpenJS Foundation", skills: ["Node.js"] },
  ],
  "full stack developer": [
    { name: "Meta Full-Stack Developer Certificate", organization: "Meta / Coursera", skills: ["React", "Node.js"] },
    { name: "AWS Developer Associate", organization: "Amazon Web Services", skills: ["AWS", "Cloud"] },
    { name: "Google Cloud Digital Leader", organization: "Google", skills: ["Cloud", "GCP"] },
  ],
  "data analyst": [
    { name: "Google Data Analytics Certificate", organization: "Google / Coursera", skills: ["SQL", "Python", "Tableau"] },
    { name: "IBM Data Analyst Professional", organization: "IBM / Coursera", skills: ["Python", "Excel", "SQL"] },
    { name: "Microsoft Power BI Data Analyst", organization: "Microsoft", skills: ["Power BI", "DAX"] },
  ],
  "machine learning engineer": [
    { name: "Google Machine Learning Crash Course", organization: "Google", skills: ["Python", "TensorFlow"] },
    { name: "TensorFlow Developer Certificate", organization: "Google", skills: ["TensorFlow", "Deep Learning"] },
    { name: "AWS Machine Learning Specialty", organization: "Amazon Web Services", skills: ["AWS", "ML"] },
  ],
};

const getHardcodedFallback = (role, experienceLevel) => {
  const key = role?.toLowerCase() || "full stack developer";
  const list = CERT_FALLBACKS[key] || CERT_FALLBACKS["full stack developer"];
  return list.map((cert) => ({
    name: cert.name,
    provider: cert.organization,
    organization: cert.organization,
    skills: cert.skills,
    level: experienceLevel === "fresher" ? "Beginner" : "Intermediate",
    why: `Recommended based on ${cert.skills.join(", ")} skills`,
    description: `Recommended based on ${cert.skills.join(", ")} skills`,
  }));
};

/**
 * Fetches certificates from the database matched to role + experienceLevel.
 * Falls back to hardcoded list only if the DB returns nothing.
 */
const getDBCerts = async (role, experienceLevel, skills = []) => {
  try {
    const dbCerts = await getRecommendedCertificatesForRole(role, experienceLevel, skills);
    if (dbCerts && dbCerts.length > 0) {
      console.log(
        `[generateCertificateAI] Returning ${dbCerts.length} certs from DB for role="${role}" level="${experienceLevel}"`
      );
      return dbCerts.map((cert) => ({
        name: cert.name,
        provider: cert.organization,
        organization: cert.organization,
        skills: cert.skills || [],
        level: cert.level,
        description: cert.description,
        why: cert.description,
        link: cert.link || "",
      }));
    }
  } catch (err) {
    console.warn("[generateCertificateAI] DB query failed:", err.message);
  }

  // DB empty or failed → last-resort hardcoded list
  console.warn(
    `[generateCertificateAI] DB returned no certs for role="${role}", using hardcoded fallback`
  );
  return getHardcodedFallback(role, experienceLevel);
};

/* ─── Main export ─── */
export async function generateCertificateAI({ role, skills = [], experienceLevel = "fresher", useAI = true }) {
  // Mechanical domain → always serve from DB (MCAD courses), never AI
  const domain = mapRoleToDomain(role);
  if (domain === "mechanical") {
    console.log("[generateCertificateAI] Mechanical role – fetching MCAD certs from DB");
    return getDBCerts(role, experienceLevel, skills);
  }

  // AI disabled → serve from DB (role-matched)
  if (ENABLE_AI !== true || useAI === false) {
    console.log("[generateCertificateAI] AI disabled – fetching certs from DB");
    return getDBCerts(role, experienceLevel, skills);
  }

  // AI enabled → ask Gemini, fall back to DB on any error
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
    // Enrich AI results with links from DB
    return await enrichWithLinks(parsed);
  } catch (err) {
    console.warn("[generateCertificateAI] Gemini failed, falling back to DB:", err.message);
    return getDBCerts(role, experienceLevel, skills);
  }
}