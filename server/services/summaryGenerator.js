// services/summaryGenerator.js

/**
 * NON-AI SUMMARY GENERATOR
 * Always returns an array of 3 summaries
 */
export const generateTemplateSummaries = ({
  role,
  skills = [],
  experienceCount = 0,
  education = [],
}) => {
  const hasRole = typeof role === "string" && role.trim().length > 0;
  const hasSkills = Array.isArray(skills) && skills.length > 0;

  const edu = education?.[0] || {};
  const educationText =
    edu.degree ||
    edu.stream ||
    edu.field ||
    edu.level ||
    "a relevant educational background";

  const skillText = hasSkills
    ? skills.slice(0, 5).join(", ")
    : "relevant tools and technologies";

  /* =====================================================
     🔒 CASE 1: ROLE OR SKILLS MISSING → DEFAULT SUMMARY
     ===================================================== */
  if (!hasRole || !hasSkills) {
    return [
      `Motivated professional with a strong foundation in ${educationText}. Demonstrates adaptability, problem-solving ability, and a commitment to continuous learning.`,

      `Detail-oriented individual with an academic background in ${educationText}. Seeking opportunities to apply knowledge and grow professionally in a structured environment.`,

      `Aspiring professional with a solid educational grounding in ${educationText}. Known for reliability, eagerness to learn, and a proactive approach to personal development.`,
    ];
  }

  /* =====================================================
     CASE 2: EXPERIENCED
     ===================================================== */
  if (experienceCount > 0) {
    return [
      `Experienced ${role} with hands-on expertise in ${skillText}, supported by a strong foundation in ${educationText}. Proven ability to deliver real-world solutions.`,

      `Results-driven ${role} bringing professional experience in ${skillText} along with a solid academic background in ${educationText}. Known for adaptability and problem-solving skills.`,

      `Detail-oriented ${role} with practical exposure to ${skillText} and a strong educational grounding in ${educationText}. Adept at collaborating in fast-paced environments.`,
    ];
  }

  /* =====================================================
     CASE 3: BEGINNER / FRESHER
     ===================================================== */
  return [
    `Motivated ${role} with a strong academic foundation in ${educationText}. Skilled in ${skillText}, with hands-on experience through academic and personal projects.`,

    `Aspiring ${role} trained in ${educationText}, possessing practical knowledge of ${skillText} gained through coursework, projects, and self-learning.`,

    `Entry-level ${role} with a solid grounding in ${educationText}. Demonstrates proficiency in ${skillText} and a strong eagerness to learn and grow professionally.`,
  ];
};