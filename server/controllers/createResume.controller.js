// import { ENABLE_AI } from "../config/env.js";
// import { model } from "../config/gemini.js";
// import { retry } from "../utils/retry.js";
// import { safeAI } from "../utils/safeAI.js";
// import { generateSoftSkills } from "../services/softSkillGenerator.js";
// import { generateSummary } from "../services/summaryGenerator.js";
// import { recommendCertifications } from "../services/certificationRecommender.js";
// import { getProjectSuggestions } from "../services/projectSuggestionService.js";

// export const createResume = async (req, res) => {
//   try {
//     const payload = req.body;
//     console.log(JSON.stringify(payload.education, null, 2));

//     const {
//       full_name,
//       role,
//       email,
//       phone = "",
//       location = "",
//       linkedin = "",
//       github = "",
//       skills,
//       softSkills = [],
//       experience = [],
//       projects = [],
//       certifications = [],
//       education,
//       useAI = false,
//     } = req.body;

//       console.log("=== CREATE_RESUME HIT ===");
// console.log("useAI:", useAI);
// console.log("ENABLE_AI:", ENABLE_AI);
// console.log("experience:", experience);

//     /* ---------- VALIDATION ---------- */
//     if (
//       !full_name ||
//       !role ||
//       !email ||
//       !Array.isArray(skills) ||
//       !skills.length ||
//       !Array.isArray(education) ||
//       !education.length
//     ) {
//       return res.status(400).json({ error: "Invalid input" });
//     }

//     const normalizedPhone =
//       typeof phone === "number" ? phone.toString() : phone;

//     const changeLog = {
//       summary: [],
//       skills: [],
//       experience: [],
//       projects: [],
//       certifications: [],
//     };

//     /* ---------- SOFT SKILLS ---------- */
//     const finalSoftSkills = softSkills.length
//       ? softSkills
//       : generateSoftSkills(role);

//     if (!softSkills.length) {
//       changeLog.skills.push("Added role-based soft skills");
//     }

//     /* ---------- EXPERIENCE ---------- */
//     if (!experience.length) {
//       changeLog.experience.push(
//         "No experience provided; fresher profile assumed",
//       );
//     }

//     /* ---------- CERTIFICATIONS ---------- */
//     if (!certifications.length) {
//       recommendCertifications({ role, skills }).forEach((c) =>
//         changeLog.certifications.push(c),
//       );
//     }

//     /* ---------- BASE RESUME ---------- */
//     const baseResume = {
//       header: {
//         name: full_name,
//         email,
//         phone: normalizedPhone,
//         location,
//         linkedin,
//         github,
//       },
//       summary: generateSummary({
//         role,
//         skills,
//         experienceCount: experience.length,
//         education,
//       }),
//       skills: {
//         technical: skills,
//         soft: finalSoftSkills,
//       },
//       experience,
//       projects,
//       education,
//       certifications_awards: certifications,
//     };

//     /* ---------- AI SUMMARY ONLY ---------- */
// const optimizedResume =
//   ENABLE_AI && useAI
//     ? await safeAI(async () => {
//         // Beginner = no experience
//         const isBeginner = !experience.length;

//         const prompt = isBeginner
//           ? `
// Rewrite the professional summary AND improve project descriptions.
// Do NOT invent experience.
// Do NOT add fake companies.

// Return JSON:
// {
//   "optimizedResume": {
//     "summary": "...",
//     "projects": [
//       { "title": "...", "description": ["..."] }
//     ]
//   }
// }

// BASE:
// ${JSON.stringify(baseResume)}
// `
//           : `
// Rewrite ONLY the professional summary.
// Do NOT add projects or experience.

// Return JSON:
// { "optimizedResume": { "summary": "..." } }

// BASE:
// ${JSON.stringify(baseResume)}
// `;

//         const r = await retry(() => model.generateContent(prompt));
//         const parsed = JSON.parse(
//           (await r.response.text()).replace(/```json|```/g, ""),
//         );

//         return {
//           ...baseResume,
//           ...parsed.optimizedResume,
//         };
//       }, () => baseResume)
//     : baseResume;


//     /* ---------- PROJECT SUGGESTIONS (SERVICE-DRIVEN) ---------- */
//     const projectSuggestions = await getProjectSuggestions({
//       role,
//       skills,
//       experience,
//       education,
//     });

//     let finalProjectSuggestions = projectSuggestions;

// if (ENABLE_AI && useAI && !experience.length) {
//   finalProjectSuggestions = await safeAI(
//     async () => {
//       const prompt = `
// Suggest 3 realistic resume projects for a beginner ${role}.
// Use the given skills.
// Do NOT invent work experience.
// Do NOT mention companies.

// Return JSON ONLY:
// {
//   "projects": [
//     {
//       "title": "Project Title",
//       "bullets": ["bullet 1", "bullet 2"]
//     }
//   ]
// }

// Skills:
// ${skills.join(", ")}
// `;

//       const r = await retry(() => model.generateContent(prompt));
//       const parsed = JSON.parse(
//         (await r.response.text()).replace(/```json|```/g, "")
//       );
//        console.log("=== AI PROJECT RESPONSE ===", parsed.projects);
//       return parsed.projects;
//     },
//     () => projectSuggestions // fallback to stored logic
//   );
// }

//     /* ---------- RESPONSE ---------- */
//     res.json({
//       optimizedResume,
//       changeLog,
//        projectSuggestions: finalProjectSuggestions,
//     });
//   } catch (err) {
//     console.error("Create Resume Error:", err);
//     res.status(500).json({ error: "Resume generation failed" });
//   }
// };


import { ENABLE_AI } from "../config/env.js";
import { model } from "../config/gemini.js";
import { retry } from "../utils/retry.js";
import { safeAI } from "../utils/safeAI.js";
import { generateSoftSkills } from "../services/softSkillGenerator.js";
import { generateSummary } from "../services/summaryGenerator.js";
import { recommendCertifications } from "../services/certificationRecommender.js";
import { generateCertificateAI } from "../services/generateCertificateAI.js";
import { getProjectSuggestions } from "../services/projectSuggestionService.js";

export const createResume = async (req, res) => {
  try {
    const payload = req.body;
    console.log(JSON.stringify(payload.education, null, 2));

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
      useAI = false,
    } = req.body;

    console.log("=== CREATE_RESUME HIT ===");
    console.log("useAI:", useAI);
    console.log("ENABLE_AI:", ENABLE_AI);
    console.log("experience:", experience);

    /* ---------- VALIDATION ---------- */
    if (
      !full_name ||
      !role ||
      !email ||
      !Array.isArray(skills) ||
      !skills.length ||
      !Array.isArray(education) ||
      !education.length
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
      certifications: [],
    };

    /* ---------- SOFT SKILLS ---------- */
    const finalSoftSkills = softSkills.length
      ? softSkills
      : generateSoftSkills(role);

    if (!softSkills.length) {
      changeLog.skills.push("Added role-based soft skills");
    }

    /* ---------- EXPERIENCE ---------- */
    if (!experience.length) {
      changeLog.experience.push(
        "No experience provided; fresher profile assumed",
      );
    }

    /* ---------- CERTIFICATIONS ---------- */
    let recommendedCerts = [];
    if (!certifications.length) {
      if (ENABLE_AI && useAI) {
        // Use AI-generated certificates when AI is enabled
        const experienceLevel = experience.length ? "intermediate" : "fresher";
        const aiCerts = await generateCertificateAI({ role, skills, experienceLevel });

        recommendedCerts = aiCerts.map((cert) => ({
          name: cert.name,
          provider: cert.provider || cert.organization || "Various",
          level: experience.length ? "Advanced" : "Beginner",
          // ✅ FIX: cert.skills may be undefined when Gemini fails and fallback runs
          why: cert.why || `Recommended based on ${(cert.skills ?? []).join(", ") || role} skills`,
        }));
      } else {
        // Fallback to rule-based recommendations
        recommendedCerts = await recommendCertifications({ role, skills });
      }
      recommendedCerts.forEach((c) => changeLog.certifications.push(c));
    }

    /* ---------- BASE RESUME ---------- */
    const baseResume = {
      header: {
        name: full_name,
        email,
        phone: normalizedPhone,
        location,
        linkedin,
        github,
      },
      summary: generateSummary({
        role,
        skills,
        experienceCount: experience.length,
        education,
      }),
      skills: {
        technical: skills,
        soft: finalSoftSkills,
      },
      experience,
      projects,
      education,
      certifications_awards: certifications,
    };

    /* ---------- AI SUMMARY ONLY ---------- */
    const optimizedResume =
      ENABLE_AI && useAI
        ? await safeAI(async () => {
            // Beginner = no experience
            const isBeginner = !experience.length;

            const prompt = isBeginner
              ? `
Rewrite the professional summary AND improve project descriptions.
Do NOT invent experience.
Do NOT add fake companies.

Return JSON:
{
  "optimizedResume": {
    "summary": "...",
    "projects": [
      { "title": "...", "description": ["..."] }
    ]
  }
}

BASE:
${JSON.stringify(baseResume)}
`
              : `
Rewrite ONLY the professional summary.
Do NOT add projects or experience.

Return JSON:
{ "optimizedResume": { "summary": "..." } }

BASE:
${JSON.stringify(baseResume)}
`;

            const r = await retry(() => model.generateContent(prompt));
            const raw = await r.response.text();

            // ✅ FIX: strip markdown fences before parsing (Gemini sometimes wraps in ```json)
            const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
            const parsed = JSON.parse(cleaned);

            return {
              ...baseResume,
              ...parsed.optimizedResume,
            };
          }, () => baseResume)
        : baseResume;

    /* ---------- PROJECT SUGGESTIONS (SERVICE-DRIVEN) ---------- */
    const projectSuggestions = await getProjectSuggestions({
      role,
      skills,
      experience,
      education,
    });

    let finalProjectSuggestions = projectSuggestions;

    if (ENABLE_AI && useAI && !experience.length) {
      finalProjectSuggestions = await safeAI(
        async () => {
          const prompt = `
Suggest 3 realistic resume projects for a beginner ${role}.
Use the given skills.
Do NOT invent work experience.
Do NOT mention companies.

Return JSON ONLY:
{
  "projects": [
    {
      "title": "Project Title",
      "bullets": ["bullet 1", "bullet 2"]
    }
  ]
}

Skills:
${skills.join(", ")}
`;

          const r = await retry(() => model.generateContent(prompt));
          const raw = await r.response.text();

          // ✅ FIX: strip markdown fences before parsing
          const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
          const parsed = JSON.parse(cleaned);

          console.log("=== AI PROJECT RESPONSE ===", parsed.projects);
          return parsed.projects;
        },
        () => projectSuggestions, // fallback to stored logic
      );
    }

    /* ---------- RESPONSE ---------- */
    res.json({
      optimizedResume,
      changeLog,
      projectSuggestions: finalProjectSuggestions,
      certificationsRecommended: recommendedCerts,
    });
  } catch (err) {
    console.error("Create Resume Error:", err);
    res.status(500).json({ error: "Resume generation failed" });
  }
};
