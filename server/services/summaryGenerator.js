export const generateSummary = ({
  role,
  skills,
  experienceCount,
  education
}) => {
  const topSkills = skills.slice(0, 3).join(", ");

  if (experienceCount > 0) {
    return `Results-driven ${role} with ${experienceCount}+ years of professional experience. Proven expertise in ${topSkills}, with a strong track record of delivering scalable and efficient solutions. Adept at collaborating with cross-functional teams and driving projects from concept to deployment.`;
  }

  return `Motivated ${role} with a strong academic foundation in ${education.degree}. Skilled in ${topSkills}, with hands-on experience through academic and personal projects. Eager to apply problem-solving abilities and technical knowledge to real-world challenges in a professional environment.`;
};
