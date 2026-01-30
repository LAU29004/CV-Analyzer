export const generateSoftSkills = (role) => {
  const common = [
    "Communication",
    "Problem Solving",
    "Team Collaboration",
    "Time Management",
    "Adaptability"
  ];

  const roleMap = {
    "Frontend Developer": ["UI Awareness", "Attention to Detail"],
    "Backend Developer": ["System Thinking", "Analytical Reasoning"],
    "Data Analyst": ["Critical Thinking", "Quantitative Reasoning"]
  };

  return [...common, ...(roleMap[role] || [])];
};
