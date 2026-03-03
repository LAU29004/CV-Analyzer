import { ENABLE_AI } from "../config/env.js";
import { model } from "../config/gemini.js";
import Certificate from "../models/Certificate.js";
import {
  getRecommendedCertificatesForRole,
  mapRoleToDomain,
} from "./certificateDataService.js";

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

/* ─── Hardcoded fallback map (last resort if DB is empty) ─── */
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

/* ─── Detailed cert metadata (used in hardcoded last-resort fallback) ─── */
const certDetails = {
  "Meta Front-End Developer": {
    organization: "Meta / Coursera",
    skills: ["HTML", "CSS", "JavaScript", "React"],
    description:
      "Directly equips a fresher with essential skills in HTML, CSS, JavaScript, and React for building modern web applications.",
  },
  "Google UX Design": {
    organization: "Google / Coursera",
    skills: ["UI/UX", "Figma", "Design"],
    description:
      "Covers UX research and design fundamentals to help beginners design user-friendly interfaces.",
  },
  "FreeCodeCamp Responsive Web Design": {
    organization: "freeCodeCamp",
    skills: ["HTML", "CSS"],
    description:
      "Beginner-friendly course teaching responsive layout, HTML semantics and accessible CSS techniques.",
  },
  "Meta Back-End Developer": {
    organization: "Meta / Coursera",
    skills: ["Node.js", "Databases", "APIs"],
    description:
      "Introduces backend fundamentals like server-side development, REST APIs and databases for entry-level engineers.",
  },
  "Node.js Developer Certification": {
    organization: "OpenJS/Foundation",
    skills: ["Node.js", "JavaScript"],
    description:
      "Validates practical Node.js skills for building scalable backend services.",
  },
  "AWS Cloud Practitioner": {
    organization: "Amazon Web Services",
    skills: ["AWS", "Cloud"],
    description:
      "A general cloud fundamentals certificate suitable for beginners learning cloud concepts.",
  },
  "Meta Full-Stack Developer": {
    organization: "Meta / Coursera",
    skills: ["React", "Node.js", "Databases"],
    description:
      "Broad full-stack curriculum teaching frontend and backend workflows for early-career developers.",
  },
  "AWS Developer Associate": {
    organization: "Amazon Web Services",
    skills: ["AWS", "Cloud", "CI/CD"],
    description:
      "Covers AWS services and deployment patterns for application developers moving beyond basics.",
  },
  "Google Cloud Digital Leader": {
    organization: "Google Cloud",
    skills: ["Cloud", "GCP"],
    description:
      "Introductory cloud certificate focused on GCP fundamentals and business use-cases.",
  },
  "Google Data Analytics": {
    organization: "Google / Coursera",
    skills: ["SQL", "Python", "Tableau"],
    description:
      "Entry-level data analytics program teaching data cleaning, analysis and visualization techniques.",
  },
  "IBM Data Analyst": {
    organization: "IBM / Coursera",
    skills: ["Python", "SQL", "Excel"],
    description:
      "Practical analytics training with tools and methods used by hiring teams for junior data roles.",
  },
  "Microsoft Power BI": {
    organization: "Microsoft",
    skills: ["Power BI", "DAX"],
    description:
      "Skill-focused certificate for data visualization and business intelligence using Power BI.",
  },
  "Google Machine Learning Crash Course": {
    organization: "Google",
    skills: ["Python", "Machine Learning"],
    description:
      "A concise practical introduction to ML concepts and TensorFlow for beginners.",
  },
  "TensorFlow Developer": {
    organization: "Google",
    skills: ["TensorFlow", "Deep Learning"],
    description:
      "Validates hands-on TensorFlow skills for implementing deep learning models.",
  },
};

/** Hardcoded fallback — only used when DB is empty/unavailable */
const getHardcodedFallback = (role, skills = [], experienceLevel) => {
  const roleKey = role?.toLowerCase() || "full stack developer";
  const list = baseCerts[roleKey] || baseCerts["full stack developer"];

  const detailed = list.map((name) => {
    const info = certDetails[name] || {};
    return {
      name,
      organization: info.organization || "Various",
      skills: info.skills || [],
      level: experienceLevel === "fresher" ? "Beginner" : "Intermediate",
      description: info.description || "Recommended certification",
    };
  });

  // score by overlap with candidate skills
  const scored = detailed.map((c) => ({
    cert: c,
    score: (c.skills || []).filter((s) =>
      skills.map((x) => x.toLowerCase()).includes(s.toLowerCase())
    ).length,
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((s) => s.cert);
};

/**
 * Fetches certs from DB matched to role + experienceLevel.
 * Falls back to hardcoded list only if DB returns nothing.
 */
const getDBCerts = async (role, skills = [], experienceLevel) => {
  try {
    const dbCerts = await getRecommendedCertificatesForRole(role, experienceLevel, skills);
    if (dbCerts && dbCerts.length > 0) {
      console.log(
        `[recommendCertifications] Returning ${dbCerts.length} certs from DB for role="${role}" level="${experienceLevel}"`
      );
      return dbCerts.map((cert) => ({
        name: cert.name,
        organization: cert.organization,
        skills: cert.skills || [],
        level: cert.level,
        description: cert.description,
      }));
    }
  } catch (err) {
    console.warn("[recommendCertifications] DB query failed:", err.message);
  }

  console.warn(
    `[recommendCertifications] DB returned no results for role="${role}", using hardcoded fallback`
  );
  return getHardcodedFallback(role, skills, experienceLevel);
};

/* ─── Main export (wrapper) ─── */
export async function recommendCertifications({ role, skills = [], experienceLevel = "fresher", useAI = true }) {
  return recommendCertificationsWithDB({ role, skills, experienceLevel, useAI });
}

/**
 * Enhanced version that saves to database after fetching recommendations.
 */
export async function recommendCertificationsWithDB({
  userId,
  role,
  skills = [],
  experienceLevel = "fresher",
  useAI = true,
}) {
  let certResults;
  let source;

  // AI disabled → fetch from DB
  if (ENABLE_AI !== true || useAI === false) {
    console.log("[recommendCertifications] AI disabled – fetching certs from DB");
    certResults = await getDBCerts(role, skills, experienceLevel);
    source = "db";
  } else {
    // AI enabled → ask Gemini, fall back to DB on error
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
      certResults = parsed;
      source = "AI";
    } catch (err) {
      console.warn("[recommendCertifications] Gemini failed, falling back to DB:", err.message);
      certResults = await getDBCerts(role, skills, experienceLevel);
      source = "db";
    }
  }

  // Save to DB if userId provided
  if (userId) {
    try {
      for (const cert of certResults) {
        await Certificate.create({
          userId,
          name: cert.name,
          organization: cert.organization,
          skills: cert.skills || [],
          level: cert.level || "Intermediate",
          description: cert.description || cert.why,
          reason: cert.why || cert.description,
          recommendedFor: { role, experienceLevel },
          source,
          status: "recommended",
        });
      }
      console.log(`[recommendCertifications] Saved ${certResults.length} certs to DB for user ${userId}`);
    } catch (dbErr) {
      console.error("[recommendCertifications] Error saving to DB:", dbErr.message);
    }
  }

  return certResults;
}