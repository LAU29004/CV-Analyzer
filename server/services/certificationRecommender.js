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
    { name: "Meta Front-End Developer Certificate", provider: "Meta / Coursera", why: "Validates React, HTML, and CSS skills essential for frontend roles" },
    { name: "Google UX Design Certificate",         provider: "Google / Coursera", why: "Covers UI/UX principles and Figma, highly valued by employers" },
    { name: "FreeCodeCamp Responsive Web Design",   provider: "freeCodeCamp",      why: "Beginner-friendly certification for core HTML/CSS skills" },
  ],
  "backend developer": [
    { name: "Meta Back-End Developer Certificate",  provider: "Meta / Coursera",    why: "Covers Node.js, Python, and REST API design patterns" },
    { name: "AWS Cloud Practitioner",               provider: "Amazon Web Services", why: "Essential cloud certification recognised by most backend employers" },
    { name: "Node.js Application Developer",        provider: "OpenJS Foundation",   why: "Industry-standard Node.js certification for backend developers" },
  ],
  "full stack developer": [
    { name: "Meta Full-Stack Developer Certificate", provider: "Meta / Coursera",    why: "End-to-end coverage of React and Node.js for full stack roles" },
    { name: "AWS Developer Associate",               provider: "Amazon Web Services", why: "Validates cloud deployment skills valued in full stack development" },
    { name: "Google Cloud Digital Leader",           provider: "Google",              why: "Recognised cloud certification to complement full stack skills" },
  ],
  "data analyst": [
    { name: "Google Data Analytics Certificate",    provider: "Google / Coursera",   why: "Covers SQL, Python, and Tableau used daily by data analysts" },
    { name: "IBM Data Analyst Professional",        provider: "IBM / Coursera",       why: "Comprehensive program covering Python, Excel, and SQL" },
    { name: "Microsoft Power BI Data Analyst",      provider: "Microsoft",            why: "Certifies Power BI skills, in high demand for analyst roles" },
  ],
  "machine learning engineer": [
    { name: "Google Machine Learning Crash Course", provider: "Google",              why: "Foundational ML certification from one of the top AI companies" },
    { name: "TensorFlow Developer Certificate",     provider: "Google",              why: "Validates deep learning and TensorFlow expertise" },
    { name: "AWS Machine Learning Specialty",       provider: "Amazon Web Services", why: "Cloud ML certification highly valued by enterprise employers" },
  ],
  "devops engineer": [
    { name: "AWS DevOps Engineer Professional",     provider: "Amazon Web Services", why: "Top certification for DevOps practices on AWS" },
    { name: "Certified Kubernetes Administrator",   provider: "CNCF",               why: "Validates container orchestration skills essential for DevOps" },
    { name: "HashiCorp Terraform Associate",        provider: "HashiCorp",           why: "Covers infrastructure-as-code skills widely used in DevOps" },
  ],
  "mobile developer": [
    { name: "Google Associate Android Developer",   provider: "Google",              why: "Official Google certification for Android development" },
    { name: "Meta iOS Developer Certificate",       provider: "Meta / Coursera",     why: "Covers Swift and iOS development best practices" },
    { name: "React Native Certificate",             provider: "Meta / Coursera",     why: "Cross-platform mobile development using React Native" },
  ],
};

const getFallback = (role, experienceLevel) => {
  const roleKey = role?.toLowerCase() || "full stack developer";

  // Try exact match first, then partial match
  let list = baseCerts[roleKey];
  if (!list) {
    const matchedKey = Object.keys(baseCerts).find((key) =>
      roleKey.includes(key) || key.includes(roleKey)
    );
    list = matchedKey ? baseCerts[matchedKey] : baseCerts["full stack developer"];
  }

  return list.map((cert) => ({
    name: cert.name,
    provider: cert.provider,
    level: experienceLevel === "fresher" ? "Beginner" : "Intermediate",
    why: cert.why,
  }));
};

/* ─── Main export ─── */
export async function recommendCertifications({
  role,
  skills = [],
  experienceLevel = "fresher",
}) {
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
Suggest 3–5 relevant professional certifications for this candidate based on their role and skills.

Rules:
- Prefer globally recognised certifications (Google, Meta, AWS, Microsoft, IBM, CNCF, etc.)
- If experience level is "fresher", prefer beginner-friendly certifications
- Avoid outdated or obscure certifications
- Tailor suggestions to the candidate's specific role and listed skills
- Output ONLY a valid JSON array — no markdown, no backticks, no explanation

Output format (strict JSON array):
[
  {
    "name": "Certification full name",
    "provider": "Issuing organisation",
    "level": "Beginner | Intermediate | Advanced",
    "why": "One-sentence reason tailored to this candidate's skills and role"
  }
]
`;

  try {
    const result = await model.generateContent(prompt);
    const raw = await result.response.text();
    const parsed = safeParseArray(raw);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Empty or invalid array returned");
    }

    // Ensure all items have the expected fields
    const validated = parsed.map((cert) => ({
      name: cert.name || "Unknown Certification",
      provider: cert.provider || cert.organization || "Unknown Provider",
      level: cert.level || "Intermediate",
      why: cert.why || "Relevant to your role and skill set",
    }));

    return validated;
  } catch (err) {
    console.warn(
      "[recommendCertifications] Gemini failed, using fallback:",
      err.message
    );
    return getFallback(role, experienceLevel);
  }
}