export const resolveDomain = ({ role = "", skills = [] }) => {
  const r = role.toLowerCase();
  const s = skills.map(k => k.toLowerCase());

  if (s.some(k => ["solidworks", "autocad", "ansys", "catia"].includes(k)))
    return "MECHANICAL";

  if (s.some(k => ["staad", "etabs", "survey"].includes(k)))
    return "CIVIL";

  if (s.some(k => ["plc", "scada", "matlab"].includes(k)))
    return "ELECTRICAL";

  if (s.some(k => ["react", "node", "python", "java", "sql"].includes(k)))
    return "SOFTWARE";

  if (r.includes("mba") || r.includes("management"))
    return "MBA";

  return "GENERAL";
};
