import { mechanicalProjects } from "../data/projects/mechanical.js";
import { softwareProjects } from "../data/projects/software.js";
import { civilProjects } from "../data/projects/civil.js";
import { electricalProjects } from "../data/projects/electrical.js";
import { mbaProjects } from "../data/projects/mba.js";

const domainMap = {
  MECHANICAL: mechanicalProjects,
  SOFTWARE: softwareProjects,
  CIVIL: civilProjects,
  ELECTRICAL: electricalProjects,
  MBA: mbaProjects,
};

const normalize = (v = "") => v.toLowerCase().trim();

export const selectFresherProjects = ({ domain, skills = [] }) => {
  const skillSet = skills.map(normalize);
  const pool = domainMap[domain] || [];

  /* ================= MATCH BY SKILLS ================= */
  const matched = pool.filter(p =>
    p.requires?.some(r => skillSet.includes(normalize(r)))
  );

  /* ================= RETURN LOGIC ================= */
  if (matched.length > 0) {
    return matched.map(p => ({
      title: p.title,
      bullets: p.bullets || [],
    }));
  }

  /* ================= FALLBACK: DOMAIN PROJECTS ================= */
  return pool.map(p => ({
    title: p.title,
    bullets: p.bullets || [],
  }));
};
