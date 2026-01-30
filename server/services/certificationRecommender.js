export const recommendCertifications = ({ role, skills }) => {
  const recommendations = [];

  const add = (topic, reason) => {
    recommendations.push(
      `Recommended certification in ${topic} to ${reason}`
    );
  };

  /* ---- Frontend ---- */
  if (role.toLowerCase().includes("frontend")) {
    if (skills.includes("JavaScript")) {
      add(
        "JavaScript Fundamentals",
        "strengthen core programming concepts essential for frontend development"
      );
    }
    if (skills.includes("React")) {
      add(
        "React.js",
        "validate component-based UI development skills used in modern web applications"
      );
    }
    add(
      "Web Performance Optimization",
      "demonstrate ability to build fast and efficient user interfaces"
    );
  }

  /* ---- Backend ---- */
  if (role.toLowerCase().includes("backend")) {
    add(
      "REST API Design",
      "show proficiency in designing scalable and maintainable backend services"
    );
    add(
      "Database Management Systems",
      "strengthen understanding of data modeling and query optimization"
    );
  }

  /* ---- Data / Analytics ---- */
  if (
    role.toLowerCase().includes("data") ||
    role.toLowerCase().includes("analyst")
  ) {
    add(
      "SQL for Data Analysis",
      "demonstrate ability to extract and analyze structured data"
    );
    add(
      "Python for Data Analysis",
      "validate skills in data cleaning, analysis, and automation"
    );
  }

  /* ---- Generic fallback ---- */
  if (!recommendations.length) {
    add(
      "Fundamentals of Software Engineering",
      "strengthen core problem-solving and development practices"
    );
  }

  return recommendations;
};
