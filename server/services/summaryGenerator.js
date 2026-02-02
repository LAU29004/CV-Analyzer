export const generateSummary = ({ role, skills, experienceCount, education }) => {
  const edu = education?.[0] || {};

  const educationText =
    edu.degree ||
    edu.stream ||
    edu.field ||
    edu.level ||
    "the relevant domain";

  if (experienceCount > 0) {
    return `Experienced ${role} with hands-on expertise in ${skills.join(
      ", "
    )}, backed by a strong foundation in ${educationText}.`;
  }

  return `Motivated ${role} with a strong academic foundation in ${educationText}. Skilled in ${skills.join(
    ", "
  )}, with hands-on experience through academic and personal projects.`;
};
