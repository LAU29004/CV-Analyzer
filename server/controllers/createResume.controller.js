import { ENABLE_AI } from "../config/env.js";
import { model } from "../config/gemini.js";
import { retry } from "../utils/retry.js";
import { safeAI } from "../utils/safeAI.js";
import { generateSoftSkills } from "../services/softSkillGenerator.js";
import { generateProjectsAI } from "../services/generateProjectsAI.js";
import { generateSummary } from "../services/summaryGenerator.js";
import { recommendCertifications } from "../services/certificationRecommender.js";

/* ================= AI DEBUG LOGGER ================= */
const logAI = (message, meta = {}) => {
  console.log(`[AI] ${message}`, meta);
};
/* ================================================== */

/* ============== EDUCATION NORMALIZE & SORT ============== */
const educationPriority = {
  Postgraduate: 4,
  Undergraduate: 3,
  Diploma: 2,
  "12th": 1,
  "10th": 0
};

const normalizeEducation = (educationList) =>
  educationList.map((edu) => ({
    level: edu.level,
    institution: edu.institution, // ONLY school / college
    board: edu.board || "",
    degree: edu.degree || "",
    duration: edu.duration || edu.year || "",
    score:
      edu.gpa
        ? `GPA: ${edu.gpa}`
        : edu.percentage
        ? `Percentage: ${edu.percentage}`
        : ""
  }));

const sortEducation = (educationList) =>
  [...educationList].sort(
    (a, b) =>
      (educationPriority[b.level] ?? 0) -
      (educationPriority[a.level] ?? 0)
  );
/* ======================================================== */

export const createResume = async (req, res) => {
  try {
    const {
      full_name,
      role,
      email,
      phone = "",
      location = "",
      linkedin = "",
      github = "",
      skills,
      softSkills = [],
      experience = [],
      projects = [],
      certifications = [],
      education,
      useAI = false
    } = req.body;

    /* ---------- VALIDATION ---------- */
    if (
      !full_name ||
      !role ||
      !email ||
      !Array.isArray(skills) ||
      skills.length === 0 ||
      !Array.isArray(education) ||
      education.length === 0
    ) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const normalizedPhone =
      typeof phone === "number" ? phone.toString() : phone;

    const changeLog = {
      summary: [],
      skills: [],
      experience: [],
      projects: [],
      certifications: []
    };

    /* ---------- SOFT SKILLS ---------- */
    const finalSoftSkills = softSkills.length
      ? softSkills
      : generateSoftSkills(role);

    if (!softSkills.length) {
      changeLog.skills.push("Added role-based soft skills");
    }

    /* ---------- PROJECTS ---------- */
    let finalProjects = projects;
    if (!projects.length) {
      finalProjects = await generateProjectsAI({ role, skills });
      finalProjects.forEach((p) =>
        changeLog.projects.push(
          `Added project "${p.title}" as no projects were provided`
        )
      );
    } else {
      changeLog.projects.push("Used projects provided by the candidate");
    }

    /* ---------- EXPERIENCE ---------- */
    if (!experience.length) {
      changeLog.experience.push(
        "No experience provided; fresher profile assumed"
      );
    } else {
      changeLog.experience.push("Used experience provided by the candidate");
    }

    /* ---------- CERTIFICATIONS ---------- */
    if (!certifications.length) {
      const recommendations = recommendCertifications({ role, skills });
      recommendations.forEach((r) =>
        changeLog.certifications.push(r)
      );
    }

    /* ---------- EDUCATION ---------- */
    const normalizedEducation = sortEducation(
      normalizeEducation(education)
    );

    /* ---------- BASE RESUME ---------- */
    const baseResume = {
      header: {
        name: full_name,
        email,
        phone: normalizedPhone,
        location,
        linkedin,
        github
      },
      summary: generateSummary({
        role,
        skills,
        experienceCount: experience.length,
        education: normalizedEducation
      }),
      skills: {
        technical: skills,
        soft: finalSoftSkills
      },
      experience,
      projects: finalProjects,
      education: normalizedEducation,
      certifications_awards: certifications
    };

    /* ---------- AI TOGGLE ---------- */
    const aiAllowed = ENABLE_AI && useAI === true;
    logAI("AI decision evaluated", { ENABLE_AI, useAI, aiAllowed });

    const optimizedResume = aiAllowed
      ? await safeAI(
          async () => {
            logAI("Calling Gemini API for summary optimization");

            const prompt = `
Rewrite the PROFESSIONAL SUMMARY only for ATS optimization.
Do NOT remove or empty the summary.
Do NOT add fake experience.

Return STRICT JSON:
{
  "optimizedResume": {
    "summary": "..."
  }
}

BASE_RESUME:
${JSON.stringify(baseResume, null, 2)}
`;

            const result = await retry(() =>
              model.generateContent(prompt)
            );

            const response = await result.response;
            const raw = await response.text();
            const cleaned = raw.replace(/```json|```/g, "").trim();
            const parsed = JSON.parse(cleaned);

            if (
              !parsed.optimizedResume ||
              !parsed.optimizedResume.summary
            ) {
              throw new Error("Invalid AI summary");
            }

            changeLog.summary.push(
              experience.length
                ? "AI-optimized summary based on experience"
                : "AI-optimized fresher summary based on skills and education"
            );

            return {
              ...baseResume,
              summary: parsed.optimizedResume.summary
            };
          },
          () => {
            changeLog.summary.push(
              "AI optimization skipped; base summary used"
            );
            return baseResume;
          }
        )
      : (() => {
          changeLog.summary.push("AI disabled; base resume used");
          return baseResume;
        })();

    return res.json({ optimizedResume, changeLog });
  } catch (err) {
    console.error("Create Resume Error:", err);
    res.status(500).json({ error: "Resume generation failed" });
  }
};
