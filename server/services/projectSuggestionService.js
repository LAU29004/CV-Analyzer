import Project from "../models/Project.js";

const normalize = (v = "") => v.toLowerCase().trim();

/**
 * Priority order:
 * 1. Role + Skill
 * 2. Skill only
 * 3. Role only
 * 4. Fallback
 */
export const getProjectSuggestions = async ({ role = "", skills = [] }) => {
  try {
    const roleLower = normalize(role);
    const skillSet = skills.map(normalize);

    const allProjects = await Project.find({});

    if (!allProjects.length) {
      return fallbackProjects();
    }

    /* ================= ROLE + SKILL ================= */

    const roleSkillMatches = allProjects.filter((p) => {
      const roleMatch =
        roleLower &&
        p.role &&
        normalize(p.role).includes(roleLower);

      const skillMatch =
        Array.isArray(p.requires) &&
        p.requires.some((r) => skillSet.includes(normalize(r)));

      return roleMatch && skillMatch;
    });

    if (roleSkillMatches.length > 0) {
      return pick(roleSkillMatches, 3);
    }

    /* ================= SKILL ONLY ================= */

    const skillOnlyMatches = allProjects.filter(
      (p) =>
        Array.isArray(p.requires) &&
        p.requires.some((r) => skillSet.includes(normalize(r)))
    );

    if (skillOnlyMatches.length > 0) {
      return pick(skillOnlyMatches, 3);
    }

    /* ================= ROLE ONLY ================= */

    const roleOnlyMatches = allProjects.filter(
      (p) =>
        roleLower &&
        p.role &&
        normalize(p.role).includes(roleLower)
    );

    if (roleOnlyMatches.length > 0) {
      return pick(roleOnlyMatches, 3);
    }

    /* ================= FALLBACK ================= */

    return fallbackProjects();
  } catch (err) {
    console.error("Project suggestion error:", err);
    return fallbackProjects();
  }
};

/* ================= HELPERS ================= */

const pick = (arr, count) =>
  arr
    .slice()
    .sort(() => 0.5 - Math.random())
    .slice(0, count)
    .map((p) => ({
      title: p.title,
      bullets: p.bullets || [],
    }));

const fallbackProjects = () => [
  {
    title: "Domain Specific Mini Project",
    bullets: [
      "identify a real world problem in your domain",
      "design and implement a practical solution",
      "document outcomes and learning",
    ],
  },
  {
    title: "Skill Enhancement Project",
    bullets: [
      "choose a core skill to strengthen",
      "build a small but complete project",
      "showcase it in your portfolio",
    ],
  },
  {
    title: "Industry Oriented Capstone Project",
    bullets: [
      "analyze an industry problem",
      "propose a scalable solution",
      "implement best practices",
    ],
  },
];
