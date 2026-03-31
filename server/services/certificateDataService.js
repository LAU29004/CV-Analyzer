import Certificate from "../models/Certificate.js";

/**
 * Master certificate database organized by domain
 */
export const CERTIFICATES_BY_DOMAIN = {
  frontend: [
    {
      name: "Meta Front-End Developer Professional Certificate",
      organization: "Meta",
      description: "Directly equips a fresher with essential skills in HTML, CSS, JavaScript, and React for building modern web applications.",
      level: "Beginner",
      skills: ["HTML", "CSS", "JavaScript", "React"],
    },
    {
      name: "Google UX Design Professional Certificate",
      organization: "Google",
      description: "Covers UX research and design fundamentals to help beginners design user-friendly interfaces.",
      level: "Beginner",
      skills: ["UI/UX", "Figma", "Design"],
    },
    {
      name: "IBM Front-End Developer Professional Certificate",
      organization: "IBM",
      description: "Offers a structured path for beginners to learn foundational web development concepts and key frontend technologies.",
      level: "Beginner",
      skills: ["HTML", "CSS", "JavaScript"],
    },
    {
      name: "freeCodeCamp Responsive Web Design",
      organization: "freeCodeCamp",
      description: "Beginner-friendly course teaching responsive layout, HTML semantics and accessible CSS techniques.",
      level: "Beginner",
      skills: ["HTML", "CSS", "Responsive Design"],
    },
  ],
  backend: [
    {
      name: "Meta Back-End Developer Professional Certificate",
      organization: "Meta",
      description: "Introduces backend fundamentals like server-side development, REST APIs and databases for entry-level engineers.",
      level: "Beginner",
      skills: ["Node.js", "Databases", "APIs"],
    },
    {
      name: "IBM Back-End Developer Professional Certificate",
      organization: "IBM",
      description: "Teaches backend development essentials including server technologies, APIs, and database management.",
      level: "Beginner",
      skills: ["Python", "Node.js", "Express"],
    },
    {
      name: "OpenJS Node.js Developer Certification",
      organization: "OpenJS Foundation",
      description: "Validates practical Node.js skills for building scalable backend services.",
      level: "Intermediate",
      skills: ["Node.js", "JavaScript"],
    },
  ],
  fullstack: [
    {
      name: "Meta Full-Stack Developer Professional Certificate",
      organization: "Meta",
      description: "Broad full-stack curriculum teaching frontend and backend workflows for early-career developers.",
      level: "Intermediate",
      skills: ["React", "Node.js", "Databases"],
    },
    {
      name: "AWS Developer Associate Certification",
      organization: "Amazon Web Services",
      description: "Covers AWS services and deployment patterns for application developers moving beyond basics.",
      level: "Intermediate",
      skills: ["AWS", "Cloud", "CI/CD"],
    },
    {
      name: "Google Cloud Digital Leader Certification",
      organization: "Google Cloud",
      description: "Introductory cloud certificate focused on GCP fundamentals and business use-cases.",
      level: "Beginner",
      skills: ["Cloud", "GCP"],
    },
  ],
  "data-science": [
    {
      name: "Google Data Analytics Professional Certificate",
      organization: "Google",
      description: "Entry-level data analytics program teaching data cleaning, analysis and visualization techniques.",
      level: "Beginner",
      skills: ["SQL", "Python", "Tableau"],
    },
    {
      name: "IBM Data Analyst Professional Certificate",
      organization: "IBM",
      description: "Practical analytics training with tools and methods used by hiring teams for junior data roles.",
      level: "Beginner",
      skills: ["Python", "SQL", "Excel"],
    },
    {
      name: "Microsoft Data Analyst with Power BI",
      organization: "Microsoft",
      description: "Skill-focused certificate for data visualization and business intelligence using Power BI.",
      level: "Intermediate",
      skills: ["Power BI", "DAX", "Analytics"],
    },
  ],
  "ai-ml": [
    {
      name: "Google Machine Learning Crash Course",
      organization: "Google",
      description: "A concise practical introduction to ML concepts and TensorFlow for beginners.",
      level: "Beginner",
      skills: ["Python", "Machine Learning"],
    },
    {
      name: "TensorFlow Developer Professional Certificate",
      organization: "Google",
      description: "Validates hands-on TensorFlow skills for implementing deep learning models.",
      level: "Intermediate",
      skills: ["TensorFlow", "Deep Learning", "Python"],
    },
    {
      name: "AWS Machine Learning Specialty",
      organization: "Amazon Web Services",
      description: "Advanced certification for ML implementation on AWS platform.",
      level: "Advanced",
      skills: ["AWS", "Machine Learning", "SageMaker"],
    },
  ],
  cloud: [
    {
      name: "AWS Cloud Practitioner",
      organization: "Amazon Web Services",
      description: "A general cloud fundamentals certificate suitable for beginners learning cloud concepts.",
      level: "Beginner",
      skills: ["AWS", "Cloud"],
    },
    {
      name: "Google Cloud Associate Cloud Engineer",
      organization: "Google Cloud",
      description: "Mid-level certification validating GCP infrastructure and application deployment skills.",
      level: "Intermediate",
      skills: ["GCP", "Cloud", "Infrastructure"],
    },
    {
      name: "Azure Fundamentals (AZ-900)",
      organization: "Microsoft",
      description: "Entry-level certification covering Azure cloud services fundamentals.",
      level: "Beginner",
      skills: ["Azure", "Cloud"],
    },
  ],
  devops: [
    {
      name: "Docker Certified Associate",
      organization: "Docker",
      description: "Validates Docker containerization and orchestration skills.",
      level: "Intermediate",
      skills: ["Docker", "Containers", "Kubernetes"],
    },
    {
      name: "Kubernetes Application Developer (CKAD)",
      organization: "Linux Foundation",
      description: "Practical certification for deploying and managing applications in Kubernetes.",
      level: "Intermediate",
      skills: ["Kubernetes", "Docker", "Containers"],
    },
  ],
  uiux: [
    {
      name: "Google UX Design Professional Certificate",
      organization: "Google",
      description: "Comprehensive UX design course covering research, wireframing, prototyping, and user testing.",
      level: "Beginner",
      skills: ["UI/UX Design", "Figma", "User Research"],
    },
    {
      name: "Interaction Design Foundation UX Design Diploma",
      organization: "Interaction Design Foundation",
      description: "In-depth UX design course covering all aspects of creating user-centered digital products.",
      level: "Intermediate",
      skills: ["UX Design", "Research", "Prototyping"],
    },
  ],
    mechanical: [
    {
      name: "UGNX",
      organization: "MCAD Solutions",
      description:
        "UGNX training focuses on advanced CAD modeling and design widely used in mechanical and automotive industries.",
      level: "Beginner",
      skills: ["CAD", "3D Modeling", "Design"],
      link: "https://mcadsolution.com/domain-courses/",
    },
    {
      name: "SOLIDWORKS",
      organization: "MCAD Solutions",
      description:
        "Covers 3D design, simulation, and product development widely used in mechanical engineering industries.",
      level: "Beginner",
      skills: ["SolidWorks", "3D Design", "Simulation"],
      link: "https://mcadsolution.com/domain-courses/",
    },
    {
      name: "CATIA V5",
      organization: "Dassault Systems / MCAD Solutions",
      description:
        "CATIA V5 is a powerful CAD software used in automotive, aerospace & manufacturing industries for 3D product design.",
      level: "Intermediate",
      skills: ["CATIA", "CAD", "Product Design"],
      link: "https://mcadsolution.com/domain-courses/",
    },
    {
      name: "BIW Fixture Design",
      organization: "MCAD Solutions",
      description:
        "Provides advanced knowledge in Body-in-White fixture design, improving job opportunities in automotive and mechanical design fields.",
      level: "Intermediate",
      skills: ["BIW", "Fixture Design", "Automotive"],
      link: "https://mcadsolution.com/domain-courses/",
    },
    {
      name: "Automotive Interior Plastic Trims",
      organization: "MCAD Solutions",
      description:
        "Industry-oriented course focused on interior plastic components design used in automotive engineering.",
      level: "Intermediate",
      skills: ["Automotive Design", "Plastic Design", "CAD"],
      link: "https://mcadsolution.com/domain-courses/",
    },
    {
      name: "Robotics Simulation",
      organization: "MCAD Solutions",
      description:
        "Corporate-level training in robotic simulation with practical industry exposure and real-world applications.",
      level: "Advanced",
      skills: ["Robotics", "Simulation", "Automation"],
      link: "https://mcadsolution.com/domain-courses/",
    },
    {
      name: "Soft Skills",
      organization: "MCAD Solutions",
      description:
        "Develops interpersonal and communication skills essential for professional and personal growth.",
      level: "Beginner",
      skills: ["Communication", "Teamwork", "Personality Development"],
      link: "https://mcadsolution.com/domain-courses/",
    },
    {
      name: "Personality Development",
      organization: "MCAD Solutions",
      description:
        "Enhances emotional intelligence, behavior, and overall personality for career success.",
      level: "Beginner",
      skills: ["Confidence", "Communication", "Emotional Intelligence"],
      link: "https://mcadsolution.com/domain-courses/",
    },
  
  ],
};

/**
 * Seed certificates to database
 * Call this once during application initialization
 */
export async function seedCertificates() {
  try {
    let totalSeeded = 0;

    for (const [domain, certs] of Object.entries(CERTIFICATES_BY_DOMAIN)) {
      for (const cert of certs) {
        await Certificate.findOneAndUpdate(
          { name: cert.name },  // match by name
          {
            name: cert.name,
            organization: cert.organization,
            description: cert.description,
            domain,
            level: cert.level || "Beginner",
            skills: cert.skills || [],
            link: cert.link || "",
          },
          { upsert: true, new: true }
        );
        totalSeeded++;
      }
    }

    console.log(`[certificateDataService] Synced ${totalSeeded} certificates to database`);
  } catch (err) {
    console.error("[certificateDataService] Error seeding certificates:", err.message);
  }
}

/**
 * Get certificates by domain
 */
export async function getCertificatesByDomain(domain, level = null) {
  try {
    const query = { domain };
    if (level) {
      query.level = level;
    }
    return await Certificate.find(query).sort({ level: 1 });
  } catch (err) {
    console.error("[certificateDataService] Error fetching certificates:", err.message);
    return [];
  }
}

/**
 * Get all certificates
 */
export async function getAllCertificates() {
  try {
    return await Certificate.find().sort({ domain: 1, level: 1 });
  } catch (err) {
    console.error("[certificateDataService] Error fetching all certificates:", err.message);
    return [];
  }
}

/**
 * Map role to domain
 */
export function mapRoleToDomain(role = "") {
  const roleMap = {
    // Web / Software
    "frontend developer": "frontend",
    "front-end developer": "frontend",
    "react developer": "frontend",
    "angular developer": "frontend",
    "vue developer": "frontend",
    "backend developer": "backend",
    "back-end developer": "backend",
    "node.js developer": "backend",
    "python developer": "backend",
    "full stack developer": "fullstack",
    "fullstack developer": "fullstack",
    "software engineer": "fullstack",
    "software developer": "fullstack",
    // Data / AI
    "data analyst": "data-science",
    "data scientist": "data-science",
    "business analyst": "data-science",
    "machine learning engineer": "ai-ml",
    "ml engineer": "ai-ml",
    "ai engineer": "ai-ml",
    "deep learning engineer": "ai-ml",
    // Cloud / DevOps
    "cloud engineer": "cloud",
    "cloud architect": "cloud",
    "aws engineer": "cloud",
    "devops engineer": "devops",
    "site reliability engineer": "devops",
    "sre": "devops",
    // Design
    "ui/ux designer": "uiux",
    "ux designer": "uiux",
    "ui designer": "uiux",
    "product designer": "uiux",
    // Security
    "cybersecurity engineer": "cybersecurity",
    "security engineer": "cybersecurity",
    "information security analyst": "cybersecurity",
    "penetration tester": "cybersecurity",
    // Mobile
    "mobile developer": "mobile",
    "android developer": "mobile",
    "ios developer": "mobile",
    "react native developer": "mobile",
    "flutter developer": "mobile",
    // Embedded
    "embedded systems engineer": "embedded",
    "firmware engineer": "embedded",
    "iot engineer": "embedded",
    // Engineering (non-IT)
    "mechanical engineer": "mechanical",
    "mechanical design engineer": "mechanical",
    "hvac engineer": "mechanical",
    "manufacturing engineer": "mechanical",
    "automotive engineer": "mechanical",
    "civil engineer": "civil",
    "structural engineer": "civil",
    "geotechnical engineer": "civil",
    "electrical engineer": "electrical",
    "electronics engineer": "electrical",
    "power systems engineer": "electrical",
    // Management
    "project manager": "project-management",
    "product manager": "project-management",
    "scrum master": "project-management",
    "program manager": "project-management",
  };

  const normalized = role.toLowerCase().trim();

  // Exact match
  if (roleMap[normalized]) return roleMap[normalized];

  // Partial / keyword match for roles not in the exact list
  if (/mechanical|hvac|manufacturing|automotive/.test(normalized)) return "mechanical";
  if (/civil|structural|geotechni/.test(normalized)) return "civil";
  if (/electrical|electronics|power/.test(normalized)) return "electrical";
  if (/frontend|front.end|react|angular|vue|ui /.test(normalized)) return "frontend";
  if (/backend|back.end|node|django|spring/.test(normalized)) return "backend";
  if (/data analyst|data sci|business intel/.test(normalized)) return "data-science";
  if (/machine learning|deep learning|\bml\b|\bai\b/.test(normalized)) return "ai-ml";
  if (/cloud|aws|azure|gcp/.test(normalized)) return "cloud";
  if (/devops|sre|reliability/.test(normalized)) return "devops";
  if (/security|cyber|pentест/.test(normalized)) return "cybersecurity";
  if (/mobile|android|ios|flutter/.test(normalized)) return "mobile";
  if (/embedded|firmware|iot/.test(normalized)) return "embedded";
  if (/project manager|product manager|scrum|agile/.test(normalized)) return "project-management";
  if (/ux|ui\/ux|design/.test(normalized)) return "uiux";

  return "fullstack"; // final default
}

/**
 * Get recommended certificates for a role
 */
export async function getRecommendedCertificatesForRole(role, experienceLevel = "fresher", skills = []) {
  try {
    const domain = mapRoleToDomain(role);

    // Build level filter
    let levelFilter;
    if (experienceLevel === "fresher" || experienceLevel === "beginner") {
      levelFilter = "Beginner";
    } else if (experienceLevel === "intermediate") {
      levelFilter = { $in: ["Beginner", "Intermediate"] };
    } else {
      levelFilter = { $in: ["Beginner", "Intermediate", "Advanced"] };
    }

    // ── Primary: query by domain + level ──
    const domainCerts = await Certificate.find({ domain, level: levelFilter })
      .sort({ level: 1 })
      .limit(3);

    if (domainCerts.length > 0) {
      console.log(`[certificateDataService] Found ${domainCerts.length} certs for domain="${domain}"`);
      return domainCerts;
    }

    // ── Secondary: skill-overlap query across ALL domains ──
    // Useful when a domain has no seeded certs yet
    if (skills.length > 0) {
      const skillCerts = await Certificate.find({
        skills: { $in: skills.map((s) => new RegExp(s, "i")) },
        level: levelFilter,
      })
        .sort({ level: 1 })
        .limit(3);

      if (skillCerts.length > 0) {
        console.log(`[certificateDataService] Found ${skillCerts.length} certs via skill overlap for role="${role}"`);
        return skillCerts;
      }
    }

    // ── Tertiary: any certs in that domain ignoring level ──
    const anyDomainCerts = await Certificate.find({ domain })
      .sort({ level: 1 })
      .limit(3);

    if (anyDomainCerts.length > 0) {
      console.log(`[certificateDataService] Found ${anyDomainCerts.length} certs (level-relaxed) for domain="${domain}"`);
      return anyDomainCerts;
    }

    console.warn(`[certificateDataService] No DB certs found for role="${role}" domain="${domain}"`);
    return [];
  } catch (err) {
    console.error("[certificateDataService] Error getting recommended certificates:", err.message);
    return [];
  }
}
