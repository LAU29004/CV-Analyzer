import { ENABLE_AI } from "../config/env.js";
import { model } from "../config/gemini.js";
import { retry } from "./retry.js";

/**
 * AI SUMMARY GENERATOR
 * Returns array of 3 summaries
 * Falls back safely if AI fails
 */
export const generateAISummaries = async ({
  role,
  skills = [],
  experienceCount = 0,
  education = [],
}) => {
  const edu = education?.[0] || {};
  const educationText =
    edu.degree || edu.stream || edu.field || edu.level || "the relevant domain";

  // 🔒 HARD fallback (used only if AI fails)
  const fallback = [
    `Professional ${role} with expertise in ${skills.join(", ")}, supported by a background in ${educationText}. Focused on delivering high-quality outcomes.`,

    `Dynamic ${role} combining ${
      experienceCount > 0 ? "industry experience" : "academic training"
    } with strong skills in ${skills.join(", ")} and a foundation in ${educationText}.`,

    `Driven ${role} with a passion for ${skills.join(", ")} and a solid grounding in ${educationText}. Known for quick learning and adaptability.`,
  ];

  // 🔥 If AI globally disabled → fallback
  if (!ENABLE_AI) return fallback;

  try {
    const prompt = `
Generate 3 distinct professional resume summaries.

RULES:
- Role: ${role}
- Skills: ${skills.join(", ")}
- Experience: ${experienceCount > 0 ? "Experienced" : "Beginner"}
- Education: ${educationText}
- Do NOT invent companies or experience
- Return ONLY a JSON array of 3 strings

FORMAT:
[
  "summary 1",
  "summary 2",
  "summary 3"
]
`;
console.log("🤖 [AI] ENABLE_AI:", ENABLE_AI);
console.log("🤖 [AI] Calling Gemini with prompt:");
console.log(prompt);
    const res = await retry(() => model.generateContent(prompt));
    console.log("🤖 [AI] Gemini response received");
const raw = (await res.response.text())
  .replace(/```json|```/g, "")
  .trim();

console.log("🤖 [AI] RAW GEMINI OUTPUT:\n", raw);

// 🔥 Extract first JSON array safely
const match = raw.match(/\[[\s\S]*\]/);

if (!match) {
  throw new Error("No JSON array found in AI response");
}

const parsed = JSON.parse(match[0]);

    if (!Array.isArray(parsed) || parsed.length !== 3) {
      throw new Error("Invalid AI summary format");
    }

    return parsed;
  } catch (err) {
    console.warn("⚠️ AI summary failed, using fallback");
    return fallback;
  }
};