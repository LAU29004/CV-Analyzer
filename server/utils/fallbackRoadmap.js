export function fallbackRoadmap(skills, targetRole) {
  // Determine current role based on experience/skills
  const currentRole = skills.length > 5 
    ? `${targetRole.split(' ')[0]} Developer`  // e.g., "Senior" → "Senior Developer"
    : 'Software Developer';

  return {
    roadmap: [
      {
        label: 'Now',
        title: 'Foundation Building',
        role: currentRole,
        skills: skills.slice(0, 4),
        color: 'violet'
      },
      {
        label: '6–12 months',
        title: 'Skill Expansion',
        role: `Intermediate ${targetRole.split(' ').pop()}`, // Last word of target role
        skills: ['System Design', 'Testing', 'CI/CD', 'Cloud Basics'],
        color: 'cyan'
      },
      {
        label: '2–3 years',
        title: 'Target Achievement',
        role: targetRole,
        skills: ['Architecture', 'Leadership', 'Advanced Cloud', 'Mentoring'],
        color: 'blue'
      }
    ]
  };
}