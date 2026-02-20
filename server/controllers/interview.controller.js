// interview.controller.js
import { model } from "../config/gemini.js";
import { buildInterviewPrompt } from "../services/prompt.service.js";

export const generateInterview = async (req, res) => {
  try {
    const { jobRole, jobDescription, experienceLevel, questionTypes } = req.body;

    if (!jobRole || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: "Job role and description are required",
      });
    }

    const prompt = buildInterviewPrompt({
      jobRole,
      jobDescription,
      experienceLevel,
      questionTypes: questionTypes || ["technical", "behavioral"],
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let raw = response.text();

    // Step 1: Strip markdown code fences
    raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

    // Step 2: Extract only the JSON object (ignore any text before/after)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON object found in Gemini response");
    }
    raw = jsonMatch[0];

    // Step 3: Fix bad escapes inside JSON string values
    // This targets unescaped backslashes that aren't valid JSON escape sequences
    raw = raw.replace(
      /"((?:[^"\\]|\\.)*)"/g,
      (match, inner) => {
        // Fix backslashes that are NOT followed by a valid JSON escape char
        const fixed = inner.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
        return `"${fixed}"`;
      }
    );

    let data;
    try {
      data = JSON.parse(raw);
    } catch (parseErr) {
      console.error("JSON still invalid after cleaning:", parseErr.message);
      console.error("Raw (first 500 chars):", raw.slice(0, 500));
      throw new Error("Gemini returned malformed JSON. Please try again.");
    }

    // Step 4: Normalize and filter by selected types
    const allowedTypes = (questionTypes || []).map(t => t.toLowerCase());

    data.questions = data.questions
      .map((q) => ({ ...q, type: q.type.toLowerCase() }))
      .filter((q) => allowedTypes.includes(q.type));

    res.status(200).json({ success: true, data });

  } catch (error) {
    console.error("Gemini Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate interview questions",
    });
  }
};