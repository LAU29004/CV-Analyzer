import crypto from "crypto";

const hash = (str) =>
  crypto.createHash("md5").update(str).digest("hex");

/* Rotate index based on skills + role + date */
const getRotationIndex = ({ role, skills }) => {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const signature = `${role}-${skills.join(",")}-${today}`;
  const h = hash(signature);
  return parseInt(h.slice(0, 8), 16);
};

export const generateProjectsAI = async ({ role, skills }) => {
  const r = role.toLowerCase();
  const rotation = getRotationIndex({ role, skills });

  /* ================= MECHANICAL ================= */
  if (r.includes("mechanical")) {
    const pool = [
      {
        title: "Mechanical Component Design and CAD Modeling",
        bullets: [
          "Designed mechanical components using CAD tools following engineering standards",
          "Created detailed 2D and 3D models to validate form, fit, and function",
          "Optimized designs for manufacturability and material efficiency"
        ]
      },
      {
        title: "Product Design and Manufacturing Process Analysis",
        bullets: [
          "Analyzed product designs for strength, durability, and reliability",
          "Evaluated manufacturing processes for cost-effective production",
          "Prepared technical drawings and fabrication documentation"
        ]
      },
      {
        title: "Thermal Engineering and Heat Transfer Analysis",
        bullets: [
          "Analyzed thermal behavior of mechanical systems using thermodynamics principles",
          "Studied heat transfer mechanisms and material performance",
          "Documented findings to support design improvements"
        ]
      },
      {
        title: "Mechanical Systems and Material Selection Study",
        bullets: [
          "Evaluated material properties for mechanical system applications",
          "Performed comparative analysis to select optimal materials",
          "Prepared technical justification for material selection"
        ]
      },
      {
        title: "Manufacturing Process Planning and Optimization",
        bullets: [
          "Studied machining and fabrication processes for mechanical components",
          "Optimized process flow to reduce production time and cost",
          "Documented process plans and quality considerations"
        ]
      }
    ];

    /* Pick 2 projects with rotation */
    const first = pool[rotation % pool.length];
    const second = pool[(rotation + 1) % pool.length];

    return [
      {
        title: first.title,
        technologies: skills.join(", "),
        bullets: first.bullets
      },
      {
        title: second.title,
        technologies: skills.join(", "),
        bullets: second.bullets
      }
    ];
  }

  /* ================= DEFAULT (CS / IT / OTHER) ================= */
  const pool = [
    {
      title: "Domain-Oriented Application Development",
      bullets: [
        "Developed application features using industry-standard practices",
        "Applied modular architecture to improve maintainability",
        "Optimized performance and usability through iterative testing"
      ]
    },
    {
      title: "System Design and Implementation Project",
      bullets: [
        "Designed system architecture based on functional requirements",
        "Implemented core features with focus on scalability",
        "Validated functionality through structured testing"
      ]
    },
    {
      title: "Technology-Based Practical Project",
      bullets: [
        "Applied technical skills to solve real-world problems",
        "Integrated multiple tools and technologies effectively",
        "Documented implementation and learning outcomes"
      ]
    }
  ];

  const first = pool[rotation % pool.length];
  const second = pool[(rotation + 1) % pool.length];

  return [
    {
      title: first.title,
      technologies: skills.join(", "),
      bullets: first.bullets
    },
    {
      title: second.title,
      technologies: skills.join(", "),
      bullets: second.bullets
    }
  ];
};
