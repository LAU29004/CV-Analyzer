export const hasText = v => typeof v === "string" && v.trim().length > 0;
export const hasArray = a => Array.isArray(a) && a.length > 0;

export const hasSkills = s =>
  hasArray(s?.technical) || hasArray(s?.soft);

export const hasExperience = e =>
  hasArray(e) && e.some(x => hasText(x.role) || hasText(x.company));

export const hasProjects = p =>
  hasArray(p) && p.some(x => hasText(x.title));

export const hasEducation = e =>
  hasArray(e) && e.some(x => hasText(x.institution));