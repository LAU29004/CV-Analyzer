import { createRequire } from "module";
import mammoth from "mammoth";
import { ENABLE_AI } from "../config/env.js";
import { safeAI } from "../utils/safeAI.js";
import { retry } from "../utils/retry.js";
import { model } from "../config/gemini.js";
import { recommendCertifications } from "../services/certificationRecommender.js";
import { generateCertificateAI } from "../services/generateCertificateAI.js";

/* ================= JSON SAFE PARSERS ================= */

/** Parses a JSON *object* from a raw LLM string */
const safeParseJSON = (text) => {
  try {
    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON object found");
    return JSON.parse(match[0]);
  } catch (err) {
    console.error("❌ AI JSON (object) Parse Failed");
    console.error(text);
    throw err;
  }
};

/** Parses a JSON *array* from a raw LLM string */
const safeParseArray = (text) => {
  try {
    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON array found");
    return JSON.parse(match[0]);
  } catch (err) {
    console.error("❌ AI JSON (array) Parse Failed");
    console.error(text);
    throw err;
  }
};

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

/* ================= LOGGER ================= */
const logAI = (message, meta = {}) => {
  console.log(`[AI][ATS] ${message}`, meta);
};

/* ================= HELPERS ================= */
const textIncludes = (text, patterns = []) =>
  patterns.some((p) => new RegExp(p, "i").test(text));

/* ================= ROLE + EXPERIENCE INFERENCE ================= */
/**
 * Rich role detection covering engineering, ML/AI, data, cloud/devops,
 * security, mobile, web, management, and design roles.
 * Sourced from Document 1 (more comprehensive than Document 2).
 */
const inferRoleAndExperience = (resume, rawText) => {
  let role = "Full Stack Developer";
  let experienceLevel = "fresher";

  const text = rawText.toLowerCase();

  // ── Role detection: most-specific first ──────────────────────────────────

  // Engineering (non-IT) — check before generic IT terms
  if (textIncludes(text, ["mechanical engineer", "hvac", "solidworks", "autocad mechanical", "catia", "ansys", "manufacturing", "automotive engineer"])) {
    role = "Mechanical Engineer";
  } else if (textIncludes(text, ["civil engineer", "structural engineer", "geotechnical", "surveying", "autocad civil", "staad", "etabs", "revit"])) {
    role = "Civil Engineer";
  } else if (textIncludes(text, ["electrical engineer", "electronics engineer", "power systems", "plc", "scada", "circuit design", "embedded", "vhdl", "fpga"])) {
    role = "Electrical Engineer";
  }
  // ML / AI — before generic data/backend
  else if (textIncludes(text, ["machine learning", "deep learning", "nlp", "computer vision", "tensorflow", "pytorch", "keras"])) {
    role = "Machine Learning Engineer";
  }
  // Data
  else if (textIncludes(text, ["data scientist", "data science"])) {
    role = "Data Scientist";
  } else if (textIncludes(text, ["data analyst", "power bi", "tableau", "business analyst", "business intelligence"])) {
    role = "Data Analyst";
  }
  // Cloud / DevOps
  else if (textIncludes(text, ["devops", "site reliability", "sre", "jenkins", "kubernetes", "terraform", "ansible"])) {
    role = "DevOps Engineer";
  } else if (textIncludes(text, ["cloud architect", "aws architect", "cloud engineer", "azure engineer", "gcp engineer"])) {
    role = "Cloud Engineer";
  }
  // Security
  else if (textIncludes(text, ["cybersecurity", "security analyst", "penetration test", "ethical hacking", "soc analyst", "information security"])) {
    role = "Cybersecurity Engineer";
  }
  // Mobile
  else if (textIncludes(text, ["android developer", "ios developer", "flutter", "react native", "mobile developer", "swift", "kotlin"])) {
    role = "Mobile Developer";
  }
  // Web / Software
  else if (textIncludes(text, ["frontend", "front-end", "react developer", "angular", "vue", "ui developer"])) {
    role = "Frontend Developer";
  } else if (textIncludes(text, ["backend", "back-end", "node.js", "django", "spring boot", "rest api", "graphql"])) {
    role = "Backend Developer";
  } else if (textIncludes(text, ["full stack", "fullstack", "mern", "mean", "lamp stack"])) {
    role = "Full Stack Developer";
  }
  // Management
  else if (textIncludes(text, ["project manager", "scrum master", "agile", "product manager", "program manager"])) {
    role = "Project Manager";
  }
  // UI/UX
  else if (textIncludes(text, ["ux designer", "ui designer", "ui/ux", "figma", "sketch", "product design"])) {
    role = "UI/UX Designer";
  }

  // ── Experience level detection ────────────────────────────────────────────
  if (
    textIncludes(text, [
      "senior", "lead ", "principal", "architect",
      "5 years", "6 years", "7 years", "8 years", "9 years", "10 years",
      "5+ years", "6+ years",
    ])
  ) {
    experienceLevel = "advanced";
  } else if (
    textIncludes(text, [
      "experienced", "2 years", "3 years", "4 years",
      "2+ years", "3+ years", "4+ years",
      "mid-level", "intermediate",
    ])
  ) {
    experienceLevel = "intermediate";
  }

  return { role, experienceLevel };
};

/* ================= SKILL EXTRACTOR FROM RAW TEXT ================= */
/**
 * Scans raw resume text for recognisable skill keywords across ALL domains.
 * Used in both AI-on and AI-off paths to ensure extracted skills are sent
 * to the cert recommender so skill-overlap DB queries can fire.
 * Sourced from Document 1.
 */
const ALL_SKILL_KEYWORDS = [
  // Web / Frontend
  "React", "Angular", "Vue", "HTML", "CSS", "JavaScript", "TypeScript",
  "Redux", "Next.js", "Nuxt", "Tailwind", "Bootstrap", "Sass",
  // Backend
  "Node.js", "Express", "Django", "Flask", "FastAPI", "Spring Boot",
  "Laravel", "Ruby on Rails", "GraphQL", "REST API",
  // Languages
  "Python", "Java", "C\\+\\+", "C#", "Go", "Ruby", "PHP", "Kotlin", "Swift",
  "Rust", "Scala", "R", "MATLAB", "Bash",
  // Databases
  "SQL", "MongoDB", "PostgreSQL", "MySQL", "SQLite", "Redis", "Firebase",
  "Cassandra", "DynamoDB", "Oracle",
  // Cloud / DevOps
  "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform", "Ansible",
  "Jenkins", "CI/CD", "Git", "GitHub Actions", "Linux",
  // Data / AI
  "TensorFlow", "PyTorch", "Keras", "Scikit-learn", "Machine Learning",
  "Deep Learning", "NLP", "Computer Vision", "Pandas", "NumPy",
  "Power BI", "Tableau", "Excel", "Spark", "Hadoop",
  // Mobile
  "Flutter", "React Native", "Android", "iOS", "Swift", "Kotlin",
  // Security
  "Cybersecurity", "Ethical Hacking", "Penetration Testing", "SIEM",
  "Wireshark", "Metasploit", "Nmap", "OWASP",
  // Mechanical Engineering
  "AutoCAD", "SolidWorks", "CATIA", "ANSYS", "MATLAB", "Fusion 360",
  "Creo", "NX", "HyperMesh", "Inventor", "HVAC", "CFD", "FEA",
  "GD&T", "CNC", "CAM", "PLM",
  // Civil Engineering
  "AutoCAD Civil 3D", "STAAD Pro", "ETABS", "SAP2000", "Revit",
  "Primavera", "MS Project", "Surveying", "GIS", "ArcGIS",
  // Electrical Engineering
  "PLC", "SCADA", "VHDL", "Verilog", "FPGA", "LabVIEW", "MATLAB Simulink",
  "Proteus", "Multisim", "Eagle", "PCB Design", "Circuit Design", "Embedded C",
  // Project Management
  "Agile", "Scrum", "Kanban", "JIRA", "Confluence", "MS Project",
  "PMP", "Six Sigma", "Lean",
  // Design
  "Figma", "Adobe XD", "Sketch", "Photoshop", "Illustrator", "InDesign",
  "UI/UX", "Wireframing", "Prototyping",
];

const extractSkillsFromText = (text = "") =>
  ALL_SKILL_KEYWORDS.filter((kw) =>
    new RegExp(kw.replace(/[+]/g, "\\$&"), "i").test(text)
  );

/* ================= ATS SCORE ================= */

/*
 * Category maximums — always sum to exactly 100:
 *   contact(15) + sections(20) + keywords(30) + experience(20)
 *   + readability(10) + formatting(5) = 100
 * Sourced from Document 2 (superior scoring system).
 */
const BREAKDOWN_MAXES = {
  contact:     15,
  sections:    20,
  keywords:    30,
  experience:  20,
  readability: 10,
  formatting:   5,
};

const ROLE_KEYWORD_BANKS = {
  frontend: [
    "react", "vue", "angular", "html", "css", "javascript", "typescript",
    "tailwind", "bootstrap", "webpack", "figma", "redux", "next.js",
    "gatsby", "sass", "responsive", "accessibility",
  ],
  backend: [
    "node", "express", "django", "flask", "spring", "postgresql", "mongodb",
    "redis", "docker", "kubernetes", "graphql", "microservices", "jwt",
    "sql", "nosql", "fastapi", "python", "rest",
  ],
  data: [
    "python", "sql", "pandas", "numpy", "tableau", "power bi", "excel",
    "spark", "hadoop", "etl", "machine learning", "r", "looker", "aws",
    "data warehouse", "analytics", "visualization",
  ],
  ml: [
    "tensorflow", "pytorch", "scikit-learn", "nlp", "deep learning",
    "neural network", "keras", "huggingface", "computer vision",
    "model training", "python", "pandas", "numpy", "kaggle",
  ],
  fullstack: [
    "react", "node", "express", "mongodb", "sql", "docker", "html",
    "css", "javascript", "next.js", "postgresql", "redis", "rest", "typescript",
  ],
};

const GENERAL_KEYWORDS = [
  "git", "agile", "scrum", "api", "linux", "cloud", "ci/cd", "testing",
  "debugging", "deployment", "database", "version control",
];

const ACTION_VERBS = [
  "built", "developed", "designed", "implemented", "led", "managed",
  "optimized", "reduced", "increased", "improved", "created", "delivered",
  "launched", "automated", "migrated", "integrated", "architected", "deployed",
  "collaborated", "mentored", "researched", "achieved", "accelerated",
  "engineered", "streamlined", "spearheaded", "coordinated",
];

/**
 * Extracts a rich text blob from the resume OBJECT only.
 * Contact header fields are EXCLUDED to prevent phone numbers or email
 * addresses accidentally matching keyword/action-verb patterns.
 * Project description is explicitly included.
 * Sourced from Document 2.
 */
const buildStructuredText = (resume) => {
  const parts = [
    resume.summary || "",
    ...(resume.skills?.technical || []),
    ...(resume.skills?.soft || []),
    ...(resume.experience || []).flatMap((e) => [
      e.role || e.title || "",
      e.company || "",
      e.description || "",
      ...(Array.isArray(e.bullets) ? e.bullets : []),
    ]),
    ...(resume.projects || []).flatMap((p) => [
      p.title || "",
      p.description || "",
      p.tech || "",
      p.techStack || "",
      ...(Array.isArray(p.bullets) ? p.bullets : []),
      ...(Array.isArray(p.technologies) ? p.technologies : []),
    ]),
    ...(resume.education || []).flatMap((e) => [
      e.institution || "",
      e.degree || "",
      e.field || "",
    ]),
    ...(resume.certifications_awards || []).map((c) =>
      typeof c === "string" ? c : c.name || ""
    ),
  ];
  return parts.filter(Boolean).join(" ");
};

const calculateATSScore = (resume, _rawText = "") => {
  /*
   * structuredText: built from the resume object — used for ALL content scoring.
   * _rawText: original uploaded PDF text — used ONLY as fallback for email/phone
   *           detection on the analyzeResume path where header parsing may be
   *           incomplete. Never used for keyword or section scoring.
   */
  const structuredText = buildStructuredText(resume);

  const breakdown = {
    contact:     0,
    sections:    0,
    keywords:    0,
    experience:  0,
    readability: 0,
    formatting:  0,
  };

  const missing     = [];
  const suggestions = [];

  /* ================================================================
     1. CONTACT INFO  (max 15 pts)
        email(5) + phone(4) + linkedin(3) + github(2) + location(1) = 15

        LinkedIn and GitHub are ONLY credited from the header object.
        A GitHub URL inside a project bullet MUST NOT score here.
     ================================================================ */
  const hasEmail =
    !!(resume.header?.email?.trim()) ||
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(_rawText);

  const hasPhone =
    !!(resume.header?.phone?.trim()) ||
    /(\+?[\d][\d\s.\-()]{8,}[\d])/.test(_rawText);

  const hasLinkedin = !!(resume.header?.linkedin?.trim());
  const hasGithub   = !!(resume.header?.github?.trim());
  const hasLocation = !!(resume.header?.location?.trim());

  if (hasEmail)    breakdown.contact += 5; else missing.push("Email address");
  if (hasPhone)    breakdown.contact += 4; else missing.push("Phone number");
  if (hasLinkedin) breakdown.contact += 3; else suggestions.push("Add your LinkedIn profile URL to the header");
  if (hasGithub)   breakdown.contact += 2; else suggestions.push("Add your GitHub profile URL to the header");
  if (hasLocation) breakdown.contact += 1; else suggestions.push("Add your city or location");

  /* ================================================================
     2. SECTIONS COVERAGE  (max 20 pts)
        summary(5) + skills(5) + experience(4) + education(4)
        + projects(2) = 20  (certs add 1 bonus, capped at 20)
     ================================================================ */
  const hasSummary    = !!(resume.summary?.trim()?.length > 20);
  const hasSkills     = (resume.skills?.technical?.length || 0) > 0 ||
                        (resume.skills?.soft?.length || 0) > 0;
  const hasExperience = (resume.experience?.length || 0) > 0;
  const hasEducation  = (resume.education?.length || 0) > 0;
  const hasProjects   = (resume.projects?.length || 0) > 0;
  const hasCerts      = (resume.certifications_awards?.length || 0) > 0;

  if (hasSummary)    breakdown.sections += 5; else missing.push("Professional summary / objective");
  if (hasSkills)     breakdown.sections += 5; else missing.push("Skills section");
  if (hasExperience) breakdown.sections += 4; else suggestions.push("Add work or internship experience");
  if (hasEducation)  breakdown.sections += 4; else missing.push("Education section");
  if (hasProjects)   breakdown.sections += 2; else suggestions.push("Add portfolio projects with GitHub links");
  if (hasCerts)      breakdown.sections += 1; // bonus, capped at max below

  /* ================================================================
     3. KEYWORDS  (max 30 pts)
        Reads from resume.skills arrays first, then scans structuredText.
     ================================================================ */
  const { role: inferredRole } = inferRoleAndExperience(resume, structuredText);

  let roleBank = ROLE_KEYWORD_BANKS.fullstack;
  if (/frontend/i.test(inferredRole))              roleBank = ROLE_KEYWORD_BANKS.frontend;
  else if (/backend/i.test(inferredRole))          roleBank = ROLE_KEYWORD_BANKS.backend;
  else if (/data analyst/i.test(inferredRole))     roleBank = ROLE_KEYWORD_BANKS.data;
  else if (/machine learning/i.test(inferredRole)) roleBank = ROLE_KEYWORD_BANKS.ml;

  const listedSkills = [
    ...(resume.skills?.technical || []),
    ...(resume.skills?.soft || []),
  ].map((s) => s.toLowerCase().trim());

  const matchKw = (kw) => {
    const kwLower = kw.toLowerCase();
    if (listedSkills.some((s) => s === kwLower || s.includes(kwLower))) return true;
    return new RegExp(`\\b${kwLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(structuredText);
  };

  const roleKeywordMatches    = roleBank.filter(matchKw).length;
  const generalKeywordMatches = GENERAL_KEYWORDS.filter(matchKw).length;

  const roleRatio    = roleKeywordMatches / roleBank.length;
  const generalRatio = generalKeywordMatches / GENERAL_KEYWORDS.length;
  const combinedScore = (roleRatio * 0.7 + generalRatio * 0.3) * 100;

  if      (combinedScore >= 70) breakdown.keywords = 30;
  else if (combinedScore >= 55) breakdown.keywords = 24;
  else if (combinedScore >= 40) breakdown.keywords = 18;
  else if (combinedScore >= 25) breakdown.keywords = 12;
  else if (combinedScore >= 10) breakdown.keywords = 6;
  else {
    breakdown.keywords = 2;
    suggestions.push("Add more role-specific technologies and tools to your skills section");
  }

  /* ================================================================
     4. EXPERIENCE DEPTH  (max 20 pts)
        roles(10) + action verbs in bullets(5) + quantified results(5)
     ================================================================ */
  const expCount = resume.experience?.length || 0;

  if      (expCount >= 3)  breakdown.experience += 10;
  else if (expCount === 2) breakdown.experience += 7;
  else if (expCount === 1) breakdown.experience += 5;
  else                     breakdown.experience += 2; // fresher baseline

  const expText = (resume.experience || [])
    .flatMap((e) => [
      e.description || "",
      ...(Array.isArray(e.bullets) ? e.bullets : []),
    ])
    .join(" ");

  const expActionVerbs = ACTION_VERBS.filter((v) =>
    new RegExp(`\\b${v}\\b`, "i").test(expText)
  ).length;

  if      (expActionVerbs >= 6) breakdown.experience += 5;
  else if (expActionVerbs >= 3) breakdown.experience += 3;
  else if (expActionVerbs >= 1) breakdown.experience += 1;
  else if (expCount > 0) suggestions.push("Use strong action verbs in experience bullets (built, optimized, led)");

  const expQuantified = (expText.match(/\b\d+\s*[%+x]|\$[\d,.]+[km]?|\d+\s*(ms|seconds?|hrs?|hours?|users?|requests?)\b/gi) || []).length;

  if      (expQuantified >= 4) breakdown.experience += 5;
  else if (expQuantified >= 2) breakdown.experience += 3;
  else if (expQuantified >= 1) breakdown.experience += 1;
  else if (expCount > 0) suggestions.push("Quantify achievements with numbers (e.g. 40% faster, 10k users)");

  /* ================================================================
     5. READABILITY  (max 10 pts)
        word count(4) + action verbs full resume(4) + quantified(2)
     ================================================================ */
  const wordCount = structuredText.trim().split(/\s+/).filter(Boolean).length;

  if      (wordCount >= 350) breakdown.readability += 4;
  else if (wordCount >= 200) breakdown.readability += 2;
  else suggestions.push("Expand your resume content — aim for 350+ words across all sections");

  const totalActionVerbs = ACTION_VERBS.filter((v) =>
    new RegExp(`\\b${v}\\b`, "i").test(structuredText)
  ).length;

  if      (totalActionVerbs >= 8) breakdown.readability += 4;
  else if (totalActionVerbs >= 4) breakdown.readability += 2;
  else if (totalActionVerbs >= 1) breakdown.readability += 1;
  else suggestions.push("Use strong action verbs throughout your resume");

  const totalQuantified = (structuredText.match(/\b\d+\s*[%+x]|\$[\d,.]+[km]?|\d+\s*(ms|seconds?|hrs?|hours?|users?|requests?)\b/gi) || []).length;

  if      (totalQuantified >= 5) breakdown.readability += 2;
  else if (totalQuantified >= 2) breakdown.readability += 1;
  else suggestions.push("Add measurable results (e.g. 'reduced load time by 40%', 'served 10k users')");

  /* ================================================================
     6. FORMATTING  (max 5 pts)
        name(2) + section completeness(3)
     ================================================================ */
  const hasName = !!(resume.header?.name?.trim()?.length > 0);
  if (hasName) breakdown.formatting += 2; else missing.push("Candidate name");

  const filledSectionCount = [hasSummary, hasSkills, hasExperience, hasEducation, hasProjects].filter(Boolean).length;
  if      (filledSectionCount >= 5) breakdown.formatting += 3;
  else if (filledSectionCount >= 4) breakdown.formatting += 2;
  else if (filledSectionCount >= 3) breakdown.formatting += 1;

  /* ================================================================
     TOTALS — cap every category at its max BEFORE summing
     ================================================================ */
  for (const key of Object.keys(breakdown)) {
    breakdown[key] = Math.min(Math.max(breakdown[key], 0), BREAKDOWN_MAXES[key]);
  }

  const total   = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const overall = Math.min(Math.round(total), 100);

  let grade = "Poor";
  if      (overall >= 85) grade = "Excellent";
  else if (overall >= 70) grade = "Good";
  else if (overall >= 50) grade = "Fair";

  const breakdownPercent = {};
  for (const key of Object.keys(breakdown)) {
    breakdownPercent[key] = Math.round((breakdown[key] / BREAKDOWN_MAXES[key]) * 100);
  }

  return {
    overall,
    grade,
    breakdown,
    breakdownMax: BREAKDOWN_MAXES,
    breakdownPercent,
    missing,
    suggestions,
    meta: {
      wordCount,
      roleKeywordMatches,
      generalKeywordMatches,
      totalActionVerbs,
      totalQuantified,
      filledSectionCount,
    },
  };
};

/* ================= HARDCODED PROJECT FALLBACKS ================= */
// Merged from both documents — Document 2 adds "description" field to each project.
const PROJECT_FALLBACKS = {
  "frontend developer": [
    {
      title: "Portfolio Website",
      description: "A responsive personal portfolio showcasing projects, skills, and contact information with dark/light mode support.",
      bullets: [
        "Built a responsive personal portfolio using React and Tailwind CSS",
        "Implemented dark/light mode toggle with persistent localStorage state",
        "Deployed on Vercel with CI/CD via GitHub Actions",
      ],
    },
    {
      title: "Todo / Task Manager App",
      description: "A drag-and-drop task management application with priority filtering and due-date reminders.",
      bullets: [
        "Developed a drag-and-drop task manager using React DnD",
        "Added local persistence with IndexedDB",
        "Implemented priority filtering and due-date reminders",
      ],
    },
  ],
  "backend developer": [
    {
      title: "RESTful Blog API",
      description: "A secure REST API for a blogging platform with JWT authentication and role-based access control.",
      bullets: [
        "Built a REST API using Node.js and Express with JWT authentication",
        "Designed a MongoDB schema for posts, comments, and user roles",
        "Added rate limiting and input sanitisation middleware",
      ],
    },
    {
      title: "URL Shortener Service",
      description: "A high-performance URL shortener with Redis caching, analytics tracking, and Docker deployment.",
      bullets: [
        "Created a URL shortener with Redis-based caching for fast redirects",
        "Exposed analytics endpoint for click-count and referrer tracking",
        "Containerised with Docker and deployed on AWS EC2",
      ],
    },
  ],
  "full stack developer": [
    {
      title: "E-Commerce Platform",
      description: "A full-stack e-commerce application with Stripe payments, image uploads, and role-based access control.",
      bullets: [
        "Built a full-stack store with React frontend and Node.js/Express backend",
        "Integrated Stripe for payments and Cloudinary for image uploads",
        "Implemented role-based access control for admin and customer accounts",
      ],
    },
    {
      title: "Real-Time Chat App",
      description: "A real-time messaging application with room-based chat, online presence indicators, and persistent chat history.",
      bullets: [
        "Developed a chat application using Socket.io and React",
        "Added room-based messaging, online presence indicators, and typing notifications",
        "Persisted chat history in MongoDB with pagination support",
      ],
    },
  ],
  "data analyst": [
    {
      title: "Sales Dashboard (Power BI / Tableau)",
      description: "An interactive KPI dashboard connected to a SQL Server data warehouse with automated refresh scheduling.",
      bullets: [
        "Created interactive KPI dashboards visualising monthly revenue trends",
        "Connected to SQL Server data warehouse using DirectQuery mode",
        "Automated report refresh schedule and distributed via Power BI Service",
      ],
    },
    {
      title: "Customer Churn Prediction",
      description: "A machine learning project predicting telecom customer churn with 84% accuracy using Python and scikit-learn.",
      bullets: [
        "Performed EDA on 50k-row telecom dataset using Python and Pandas",
        "Built a logistic regression model with 84% accuracy using scikit-learn",
        "Presented findings with Matplotlib/Seaborn charts in a Jupyter notebook",
      ],
    },
  ],
  "machine learning engineer": [
    {
      title: "Image Classification CNN",
      description: "A convolutional neural network trained on CIFAR-10 achieving 91% test accuracy, exported and served via Flask.",
      bullets: [
        "Trained a convolutional neural network on CIFAR-10 achieving 91% test accuracy",
        "Applied data augmentation and dropout regularisation to prevent overfitting",
        "Exported model as TensorFlow SavedModel and served via Flask API",
      ],
    },
    {
      title: "Sentiment Analysis API",
      description: "A fine-tuned BERT model for binary sentiment classification, containerised and deployed on Google Cloud Run.",
      bullets: [
        "Fine-tuned a BERT-based model on IMDB reviews for binary sentiment classification",
        "Wrapped inference in a FastAPI endpoint with async request handling",
        "Containerised with Docker and deployed on Google Cloud Run",
      ],
    },
  ],
};

const getProjectFallback = (role) => {
  const key = role?.toLowerCase() || "full stack developer";
  return PROJECT_FALLBACKS[key] || PROJECT_FALLBACKS["full stack developer"];
};

/* ================= HARDCODED SUMMARY FALLBACKS ================= */
// Sourced from Document 2 — not present in Document 1.
const SUMMARY_FALLBACKS = {
  "frontend developer": [
    "Creative and detail-oriented Frontend Developer skilled in building responsive, accessible web applications using React and modern CSS. Passionate about crafting pixel-perfect UIs and optimising user experience across devices.",
    "Motivated Frontend Developer with hands-on experience in React, TypeScript, and Tailwind CSS. Adept at translating design mockups into clean, maintainable code and collaborating in agile teams.",
    "Enthusiastic Frontend Developer focused on building fast, responsive interfaces using component-driven architecture. Experienced with state management, REST API integration, and CI/CD deployment workflows.",
  ],
  "backend developer": [
    "Results-driven Backend Developer proficient in Node.js, Express, and MongoDB. Experienced in designing scalable REST APIs, implementing JWT authentication, and deploying containerised services on cloud platforms.",
    "Backend Developer with a strong foundation in server-side architecture, database design, and API development. Skilled in Node.js and Python with a focus on security, performance, and clean code principles.",
    "Detail-oriented Backend Developer specialising in building robust microservices and RESTful APIs. Comfortable with SQL and NoSQL databases, Redis caching, and Docker-based deployment pipelines.",
  ],
  "full stack developer": [
    "Versatile Full Stack Developer experienced in building end-to-end web applications using the MERN stack. Skilled at delivering seamless user experiences while maintaining secure, scalable backend systems.",
    "Full Stack Developer with expertise in React and Node.js, bringing ideas from design to deployment. Comfortable working across the entire stack, from database modelling to UI implementation and cloud hosting.",
    "Ambitious Full Stack Developer passionate about creating feature-rich web applications. Proven ability to work with REST APIs, relational and non-relational databases, and modern frontend frameworks.",
  ],
  "data analyst": [
    "Analytical Data Analyst with expertise in SQL, Python, and Power BI. Skilled at transforming complex datasets into actionable insights that drive business decisions and improve operational efficiency.",
    "Data Analyst with a strong foundation in statistical analysis, data visualisation, and dashboard development. Experienced in using Excel, Tableau, and Python to identify trends and communicate findings clearly.",
    "Detail-oriented Data Analyst proficient in deriving business insights from large datasets using SQL and Python. Adept at building interactive dashboards and presenting data-driven recommendations to stakeholders.",
  ],
  "machine learning engineer": [
    "Machine Learning Engineer with experience in building and deploying predictive models using TensorFlow and scikit-learn. Passionate about applying AI to solve real-world problems with measurable impact.",
    "Innovative ML Engineer skilled in deep learning, NLP, and computer vision. Experienced in the full model lifecycle, from data preprocessing and feature engineering to deployment via REST APIs.",
    "Results-oriented Machine Learning Engineer with hands-on experience in model training, evaluation, and optimisation. Proficient in Python, PyTorch, and cloud-based ML deployment on AWS and GCP.",
  ],
  default: [
    "Motivated and detail-oriented professional with a strong technical foundation and a passion for building efficient, user-centric solutions. Eager to contribute skills and grow within a collaborative team environment.",
    "Dedicated software professional with experience in development, problem-solving, and cross-functional collaboration. Committed to writing clean code and delivering high-quality products on time.",
    "Enthusiastic and adaptable professional with a solid technical skill set and a drive for continuous learning. Looking to leverage expertise in a dynamic environment to create meaningful impact.",
  ],
};

const getSummaryFallback = (role) => {
  const key = role?.toLowerCase() || "default";
  return SUMMARY_FALLBACKS[key] || SUMMARY_FALLBACKS["default"];
};

/* ================= AI PROJECT SUGGESTIONS ================= */
/**
 * Generates 2–3 project suggestions via Gemini when AI is enabled.
 * Falls back to hardcoded suggestions on any failure.
 * Includes "description" field in both AI prompt and fallbacks.
 */
const generateProjectSuggestions = async ({ role, skills = [], experienceLevel = "fresher" }) => {
  if (ENABLE_AI !== true) {
    logAI("AI disabled – returning hardcoded project suggestions");
    return getProjectFallback(role);
  }

  const prompt = `
You are a career advisor helping a ${experienceLevel} ${role} build a strong resume.

Skills they know: ${skills.join(", ")}

Suggest 2–3 portfolio projects they can build to strengthen their resume.

Rules:
- Projects must be realistic for a ${experienceLevel}
- Each project should use at least one of their existing skills
- Include a "description" field: 1–2 sentences summarising what the project does and its purpose
- Bullet points should be achievement-oriented (action verb + metric/outcome)
- Output ONLY a valid JSON array — no markdown, no backticks, no explanation

Output format (strict):
[
  {
    "title": "Project name",
    "description": "One to two sentence overview of what the project does and its purpose.",
    "bullets": [
      "Bullet 1 describing a feature or achievement",
      "Bullet 2 describing a technical decision or result",
      "Bullet 3 describing deployment or impact"
    ]
  }
]
`;

  try {
    const result = await retry(() => model.generateContent(prompt));
    const raw = await result.response.text();
    const parsed = safeParseArray(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Empty array");
    logAI("Project suggestions generated via Gemini", { count: parsed.length });
    return parsed;
  } catch (err) {
    console.warn("[generateProjectSuggestions] Gemini failed, using fallback:", err.message);
    return getProjectFallback(role);
  }
};

/* ================= ANALYZE RESUME CONTROLLER ================= */
export const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No resume uploaded" });
    }

    /* ---------- TEXT EXTRACTION ---------- */
    let resumeText = "";

    if (req.file.mimetype === "application/pdf") {
      const parser = new PDFParse({ data: req.file.buffer });
      const pdf = await parser.getText();
      await parser.destroy();
      resumeText = pdf.text;
    } else {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      resumeText = result.value;
    }

    if (!resumeText.trim()) {
      return res.status(400).json({ error: "Empty resume text" });
    }

    /* ---------- BASE STRUCTURE ---------- */
    const baseOptimizedResume = {
      header: {},
      summary: "",
      skills: { technical: [], soft: [] },
      experience: [],
      projects: [],
      education: [],
      certifications_awards: [],
    };

    const aiAllowed = ENABLE_AI === true;
    logAI("AI enabled", { aiAllowed });

    /* ---------- Infer role/skills from raw text (used in both paths) ---------- */
    const { role: inferredRole, experienceLevel: inferredLevel } =
      inferRoleAndExperience(baseOptimizedResume, resumeText);
    const detectedSkills = extractSkillsFromText(resumeText);

    /* ---------- Non-AI fallback ---------- */
    const buildFallback = async () => {
      const rawCerts = await generateCertificateAI({
        role: inferredRole,
        skills: detectedSkills,
        experienceLevel: inferredLevel,
      });

      const certificationSuggestions = rawCerts.map((cert) => ({
        name: cert.name,
        organization: cert.organization || cert.provider || "Various",
        provider: cert.provider || cert.organization || "Various",
        description:
          cert.description || `Recommended based on your ${inferredRole} profile`,
        level:
          cert.level || (inferredLevel === "fresher" ? "Beginner" : "Intermediate"),
        skills: cert.skills || [],
        why: cert.why || `Recommended based on your ${inferredRole} profile`,
        link: cert.link || "",
      }));

      return {
        analysis: {
          strengths: ["Resume text extracted successfully"],
          weaknesses: ["AI optimization skipped or unavailable"],
        },
        optimizedResume: baseOptimizedResume,
        atsScore: calculateATSScore(baseOptimizedResume, resumeText),
        certificationSuggestions,
      };
    };

    const finalResponse = aiAllowed
      ? await safeAI(
          async () => {
            const prompt = `
You are an ATS resume analyzer.

RULES:
- DO NOT invent experience or projects
- Preserve candidate domain
- STRICT JSON ONLY
- For each project include a "description" field (1-2 sentences)

FORMAT:
{
  "analysis": {
    "strengths": ["List 3 key strengths"],
    "weaknesses": ["List 3-5 specific, actionable suggestions to improve content, impact, or clarity"]
  },
  "optimizedResume": {
    "header": {},
    "summary": "",
    "skills": { "technical": [], "soft": [] },
    "experience": [],
    "projects": [],
    "education": [],
    "certifications_awards": []
  }
}

RESUME TEXT:
<<<
${resumeText}
>>>
`;

            const result = await retry(() => model.generateContent(prompt));
            const raw = await result.response.text();
            let parsed;

            try {
              parsed = safeParseJSON(raw);
            } catch {
              return buildFallback();
            }

            const mergedResume = {
              ...baseOptimizedResume,
              ...parsed.optimizedResume,
              skills: {
                technical: parsed.optimizedResume.skills?.technical || [],
                soft: parsed.optimizedResume.skills?.soft || [],
              },
            };

            const atsScore = calculateATSScore(mergedResume, resumeText);
            const { role, experienceLevel } = inferRoleAndExperience(mergedResume, resumeText);

            // Use AI-parsed skills; fall back to text-extracted skills if empty
            const aiSkills =
              mergedResume.skills.technical.length > 0
                ? mergedResume.skills.technical
                : detectedSkills;

            const rawCerts = await generateCertificateAI({
              role,
              skills: aiSkills,
              experienceLevel,
            });

            const certificationSuggestions = rawCerts.map((cert) => ({
              name: cert.name,
              organization: cert.organization || cert.provider || "Various",
              provider: cert.provider || cert.organization || "Various",
              description:
                cert.description || `Recommended based on your ${role} profile`,
              level:
                cert.level || (experienceLevel === "fresher" ? "Beginner" : "Intermediate"),
              skills: cert.skills || [],
              why: cert.why || `Recommended based on your ${role} profile`,
              link: cert.link || "",
            }));

            return {
              analysis: parsed.analysis || (await buildFallback()).analysis,
              optimizedResume: mergedResume,
              atsScore,
              certificationSuggestions,
            };
          },
          () => buildFallback()
        )
      : await buildFallback();

    return res.json(finalResponse);
  } catch (err) {
    console.error("ATS ERROR:", err);
    return res.status(500).json({ error: "Resume analysis failed" });
  }
};

/* ================= CREATE RESUME CONTROLLER ================= */
/**
 * Called by POST /api/public/create-resume
 * Receives structured form data, generates resume + project suggestions + certs.
 * Returns summaryOptions (3 choices) in addition to optimizedResume.
 */
export const createResume = async (req, res) => {
  try {
    const {
      full_name,
      role,
      email,
      phone,
      location,
      linkedin,
      github,
      skills = [],
      softSkills = [],
      experience = [],
      projects = [],
      education = [],
      certifications = [],
      useAI,
      jobDescription,
    } = req.body;

    if (!full_name || !email || !role) {
      return res.status(400).json({ error: "full_name, email, and role are required" });
    }

    const aiAllowed = ENABLE_AI === true;
    logAI("Beginner flow – AI enabled", { aiAllowed });

    /* ---------- Build base optimizedResume from form data ---------- */
    const baseOptimizedResume = {
      header: {
        name: full_name,
        email,
        phone: phone || undefined,
        location: location || undefined,
        linkedin: linkedin || undefined,
        github: github || undefined,
      },
      summary: "",
      skills: {
        technical: Array.isArray(skills) ? skills : [],
        soft: Array.isArray(softSkills) ? softSkills : [],
      },
      experience,
      projects,
      education,
      certifications_awards: certifications,
    };

    /* ---------- Infer role context for suggestions ---------- */
    const normalizedRole = role.toLowerCase();
    let inferredRole = "Full Stack Developer";
    if (/frontend|react|ui|ux/.test(normalizedRole))                      inferredRole = "Frontend Developer";
    else if (/backend|node|api|server/.test(normalizedRole))              inferredRole = "Backend Developer";
    else if (/data analyst|analyst|bi|sql/.test(normalizedRole))          inferredRole = "Data Analyst";
    else if (/machine learning|ml|ai|deep learning/.test(normalizedRole)) inferredRole = "Machine Learning Engineer";
    else if (/full.?stack/.test(normalizedRole))                          inferredRole = "Full Stack Developer";

    const experienceLevel = experience.length > 0 ? "intermediate" : "fresher";

    let optimizedResume = { ...baseOptimizedResume };

    /* ---------- Summary Options (3 AI or 3 hardcoded) ---------- */
    const inferredKey = inferredRole.toLowerCase();
    let summaryOptions = SUMMARY_FALLBACKS[inferredKey] || SUMMARY_FALLBACKS["default"];

    if (aiAllowed) {
      try {
        const summaryPrompt = `
You are a professional resume writer.
Candidate: ${full_name}
Role: ${role}
Skills: ${skills.join(", ")}
Experience: ${experience.length > 0 ? JSON.stringify(experience) : "Fresher / No work experience"}
${jobDescription ? `Job Description:\n${jobDescription}` : ""}
Write EXACTLY 3 different professional resume summary options for this candidate.
Each summary must be 2–3 sentences, highlight their key skills, and have a slightly different tone or emphasis.
Output ONLY a valid JSON array of exactly 3 strings, no markdown, no labels, no explanation.
Example format:
["Summary option 1 text.", "Summary option 2 text.", "Summary option 3 text."]
`;
        const summaryResult = await retry(() => model.generateContent(summaryPrompt));
        const raw = (await summaryResult.response.text()).trim();
        const parsed = safeParseArray(raw);
        if (Array.isArray(parsed) && parsed.length >= 3) {
          summaryOptions = parsed.slice(0, 3);
          logAI("3 AI summaries generated successfully");
        } else {
          console.warn("[createResume] AI returned fewer than 3 summaries, using hardcoded fallback");
        }
      } catch (err) {
        console.warn("[createResume] Summary generation failed, using hardcoded fallback:", err.message);
      }
    }

    // Use first summary option as the default in optimizedResume
    optimizedResume.summary = summaryOptions[0];

    /* ---------- ATS Score ---------- */
    // Pass empty string as _rawText — all data is already in the resume object
    const atsScore = calculateATSScore(optimizedResume, "");

    /* ---------- Project Suggestions (AI or fallback) ---------- */
    const projectSuggestions = await generateProjectSuggestions({
      role: inferredRole,
      skills: optimizedResume.skills.technical,
      experienceLevel,
    });

    /* ---------- Certification Recommendations (AI or fallback) ---------- */
    const rawCerts = await generateCertificateAI({
      role: inferredRole,
      skills: optimizedResume.skills.technical,
      experienceLevel,
    });

    const certificationsRecommended = rawCerts.map((cert) => ({
      name: cert.name,
      organization: cert.organization || cert.provider || "Various",
      provider: cert.provider || cert.organization || "Various",
      description:
        cert.description || `Recommended based on your ${inferredRole} profile`,
      level:
        cert.level || (experienceLevel === "fresher" ? "Beginner" : "Intermediate"),
      skills: cert.skills || [],
      why: cert.why || `Recommended based on your ${inferredRole} profile`,
    }));

    return res.json({
      optimizedResume,
      atsScore,
      projectSuggestions,
      certificationsRecommended,
      summaryOptions,
    });
  } catch (err) {
    console.error("CREATE RESUME ERROR:", err);
    return res.status(500).json({ error: "Resume creation failed" });
  }
};