import { softwareProjects } from "../data/projects/software.js";
import { mbaProjects } from "../data/projects/mba.js";
import { civilProjects } from "../data/projects/civil.js";
import { mechanicalProjects } from "../data/projects/mechanical.js";
import { electricalProjects } from "../data/projects/electrical.js";

const normalize = (v = "") => v.toLowerCase().trim();

/**
 * Returns project suggestions based on ROLE + SKILLS
 */
export const getProjectSuggestions = ({ role = "", skills = [] }) => {
  const roleLower = normalize(role);
  const skillSet = skills.map(normalize);

  let projectPool = [];

  /* ================= SELECT PROJECT POOL BY ROLE ================= */
if (roleLower.includes("civil")) {
  projectPool = civilProjects;
}
else if (roleLower.includes("mechanical")) {
  projectPool = mechanicalProjects;
}
else if (roleLower.includes("electrical")) {
  projectPool = electricalProjects;
}
else if (
  roleLower.includes("software") ||
  roleLower.includes("software engineer") ||
  roleLower.includes("software developer")
) {
  projectPool = softwareProjects;
}
else if (
  roleLower.includes("mba") ||
  roleLower.includes("management") ||
  roleLower.includes("business")
) {
  projectPool = mbaProjects;
}


  /* ================= FILTER BY SKILLS ================= */

  const matchedProjects = projectPool.filter((project) =>
    project.requires?.some((req) => skillSet.includes(normalize(req)))
  );

  /* ================= RETURN MATCHED OR FALLBACK ================= */

if (matchedProjects.length > 0) {
  const remaining = projectPool.filter(
    (p) => !matchedProjects.includes(p)
  );

  return [...matchedProjects, ...remaining].slice(0, 3).map((p) => ({
    title: p.title,
    bullets: p.bullets || [],
  }));
}


  // Role matched but skills didn’t
  if (projectPool.length > 0) {
    return projectPool.map((p) => ({
  title: p.title,
  bullets: p.bullets || [],
}));

  }

  // Final generic fallback
  return [
  {
    title: "Domain Specific Mini Project",
    bullets: [
      "Identify a real-world problem in your domain",
      "Design and implement a practical solution",
      "Document outcomes and learning"
    ],
  }
];
};
