import { model } from "../config/gemini.js";
import { retry } from "../utils/retry.js";

export const generateProjectsAI = async ({ role, skills, industry }) => {
  // Infer industry if not provided
  let inferred = industry;
  if (!inferred) {
    if (role.includes("Frontend") || role.includes("Backend")) inferred = "Tech";
    if (role.includes("Finance") || role.includes("Analyst")) inferred = "FinTech";
    if (role.includes("Healthcare")) inferred = "HealthTech";
    if (role.includes("AI") || role.includes("ML")) inferred = "AI/ML";
  }

  const prompt = `
You are a senior hiring manager and resume specialist.

TASK:
Generate 2 realistic and unique resume projects for a fresher targeting a ${role} role in the ${inferred} industry.

CONTEXT:
Technical Skills: ${skills.join(", ")}
Industry: ${inferred}

RULES:
- Projects must be relevant to the role + industry + skills
- Each project must be buildable within 2-6 weeks
- Bullet points must follow ATS format: Action + Impact + Tech
- No templates
- Output strictly in JSON format (no markdown)

SCHEMA:
[
  {
    "title": "",
    "industryAlignment": "", // Explain 1 sentence why it's relevant
    "technologies": "",
    "bullets": [
      "Action/Impact bullet...",
      "Action/Impact bullet...",
      "Action/Impact bullet..."
    ]
  }
]
`;

  const result = await retry(() => model.generateContent(prompt));
  const response = await result.response;
  const raw = await response.text();

  try {
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("AI Project JSON Parse Error:", raw);
    return [];
  }
};
