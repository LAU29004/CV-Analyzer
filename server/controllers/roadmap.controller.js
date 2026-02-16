import multer from "multer";
import { parseResume } from "../utils/parseResume.js";
import { generateRoadmapAI } from "../utils/aiRoadmap.js";
import { fallbackRoadmap } from "../utils/fallbackRoadmap.js";

const upload = multer({ storage: multer.memoryStorage() });
export const uploadMiddleware = upload.single("resume");

export async function generateRoadmap(req, res) {
  try {
    let skills = [];
    const { experienceLevel, targetRole, jobDescription } = req.body;

    const COMMON_SKILLS = [
      "React",
      "TypeScript",
      "Node.js",
      "Node",
      "Python",
      "JavaScript",
      "AWS",
      "Docker",
      "MongoDB",
      "PostgreSQL",
      "Git",
      "GraphQL",
      "Kubernetes",
      "Redux",
    ];

    if (req.file) {
      const resumeText = await parseResume(req.file);
      const regex = new RegExp(`\\b(${COMMON_SKILLS.join("|")})\\b`, "gi");
      const matches = resumeText.match(regex) || [];
      skills = Array.from(new Set(matches.map((m) => m.trim())));
    } else if (req.body.skills) {
      // skills might be sent as JSON string or array
      if (typeof req.body.skills === "string") {
        try {
          skills = JSON.parse(req.body.skills);
        } catch {
          skills = req.body.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
      } else if (Array.isArray(req.body.skills)) {
        skills = req.body.skills.map((s) => String(s).trim()).filter(Boolean);
      }
    }

    const result = await generateRoadmapAI({
      skills,
      experienceLevel,
      targetRole,
      jobDescription,
    });

    // ensure consistent response shape
    if (!result || !Array.isArray(result.roadmap)) {
      throw new Error("Invalid roadmap from AI");
    }

    res.json({ success: true, roadmap: result.roadmap });
  } catch (err) {
    console.error("Roadmap generation error:", err);

    // Return fallback but indicate it's a fallback
    res.json({
      success: true,
      fallback: true,
      message: "Using fallback roadmap due to AI service error",
      ...fallbackRoadmap(req.body.skills || [], req.body.targetRole),
    });
  }
}
