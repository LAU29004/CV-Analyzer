export const calculateATSScore = ({ text, optimizedResume }) => {
  let score = 0;
  const breakdown = {};
  const missing = [];

  /* ---------- CONTACT INFO (10) ---------- */
  let contactScore = 0;
  const header = optimizedResume.header || {};

  if (header.email) contactScore += 4;
  if (header.phone) contactScore += 3;
  if (header.linkedin || header.github) contactScore += 3;

  breakdown.contact = contactScore;
  score += contactScore;

  /* ---------- SECTIONS (20) ---------- */
  let sectionScore = 0;

  if (optimizedResume.summary) sectionScore += 5;
  else missing.push("Missing professional summary");

  if (optimizedResume.skills?.technical?.length) sectionScore += 5;
  else missing.push("Missing technical skills");

  if (optimizedResume.education?.length) sectionScore += 5;
  else missing.push("Missing education section");

  if (
    optimizedResume.experience?.length ||
    optimizedResume.projects?.length
  ) {
    sectionScore += 5;
  } else {
    missing.push("No experience or projects found");
  }

  breakdown.sections = sectionScore;
  score += sectionScore;

  /* ---------- KEYWORDS (30) ---------- */
  const keywordList = [
    ...(optimizedResume.skills?.technical || []),
    ...(optimizedResume.skills?.soft || [])
  ];

  const foundKeywords = keywordList.filter((k) =>
    text.toLowerCase().includes(String(k).toLowerCase())
  );

  const keywordScore = Math.min(
    30,
    Math.round((foundKeywords.length / Math.max(keywordList.length, 1)) * 30)
  );

  breakdown.keywords = keywordScore;
  score += keywordScore;

  /* ---------- READABILITY (15) ---------- */
  const bulletCount = (text.match(/•|\-/g) || []).length;
  const sentenceCount = (text.match(/\./g) || []).length;

  let readabilityScore = 0;
  if (bulletCount >= 8) readabilityScore += 8;
  if (sentenceCount >= 10) readabilityScore += 7;

  breakdown.readability = readabilityScore;
  score += readabilityScore;

  /* ---------- FORMATTING & FILE QUALITY (15) ---------- */
  let formatScore = 0;

  if (text.length > 1000) formatScore += 10;
  else missing.push("Resume content too short");

  if (!text.includes("Table") && !text.includes("|")) {
    formatScore += 5;
  } else {
    missing.push("Tables detected (ATS may struggle)");
  }

  breakdown.formatting = formatScore;
  score += formatScore;

  /* ---------- FINAL ---------- */
  return {
    overall: Math.min(score, 100),
    breakdown,
    missing
  };
};
