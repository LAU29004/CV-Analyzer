import { model } from "../config/gemini.js";
import { retry } from "../utils/retry.js";
import { generateSoftSkills } from "../services/softSkillGenerator.js";
import { generateProjectsAI } from "../services/generateProjectsAI.js";

export const createResume = async (req, res) => {
  try {
    const {
      full_name,
      role,
      industry,
      email,
      phone,
      location,
      linkedin,
      education,
      skills
    } = req.body;

    if (!full_name || !role || !email || !skills || !education) {
      return res.status(400).json({
        error: "Missing required fields",
        required: [
          "full_name", "role", "email", "skills", "education"
        ]
      });
    }

    const softSkills = generateSoftSkills(role);
    const autoProjects = await generateProjectsAI({ role, skills, industry });


    const prompt = `
You are an expert ATS resume writer specializing in fresher and internship resumes.

TASK:
Generate an ATS-optimized resume in STRICT JSON using the schema below.
Autogenerate missing fields like projects, summary, soft skills.

RULES:
- JSON ONLY
- No markdown, no explanation
- Bullet format must follow Action + Result style
- Skills must be split into technical + soft
- Experience should be empty for freshers

SCHEMA:
{
  "optimizedResume": {
    "header": {
      "name": "",
      "email": "",
      "phone": "",
      "location": "",
      "linkedin": ""
    },
    "summary": "",
    "skills": {
      "technical": [],
      "soft": []
    },
    "experience": [],
    "projects": [
      {
        "title": "",
        "technologies": "",
        "bullets": []
      }
    ],
    "education": [
      {
        "institution": "",
        "degree": "",
        "duration": "",
        "gpa": "",
        "highlights": []
      }
    ],
    "certifications_awards": []
  }
}

USER DATA:
Name: ${full_name}
Role Applying: ${role}
Email: ${email}
Phone: ${phone}
Location: ${location}
LinkedIn: ${linkedin || ""}
Education: ${education.degree} at ${education.college} (${education.year})
Technical Skills: ${skills.join(", ")}
Soft Skills: ${softSkills.join(", ")}
Suggested Projects: ${JSON.stringify(autoProjects)}
`;

    const result = await retry(() => model.generateContent(prompt));
    const response = await result.response;
    const raw = await response.text();

    let data;
    try {
      const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
      data = JSON.parse(cleaned);
    } catch (err) {
      return res.status(500).json({
        error: "Invalid AI JSON output",
        raw: raw
      });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error("Create Resume Error:", err);
    res.status(500).json({
      error: "Failed generating resume",
      details: err.message
    });
  }
};
