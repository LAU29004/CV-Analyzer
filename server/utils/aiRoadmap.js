import { model } from '../config/gemini.js';

export async function generateRoadmapAI({
  skills,
  experienceLevel,
  targetRole,
  jobDescription
}) {
  const prompt = `
You are an expert career advisor creating personalized career roadmaps.

ANALYZE THIS PROFILE:
- Current Skills: ${skills.join(', ')}
- Experience Level: ${experienceLevel}
- Target Role: ${targetRole}
${jobDescription ? `- Job Description: ${jobDescription}` : ''}

INSTRUCTIONS:
1. Assess the gap between current skills and the target role
2. Create a realistic 3-milestone progression toward ${targetRole}
3. Each milestone should have:
   - A realistic intermediate role title (not generic "developer")
   - Skills to learn that build on existing knowledge
   - Timeline that fits the experience level
4. Make the roadmap SPECIFIC to ${targetRole}, not generic software engineering

RULES:
- Use the actual target role in the final milestone
- Suggest 3-5 relevant skills per milestone
- Consider the experience level when setting timelines
- Make intermediate roles relevant to the target (e.g., if target is "Data Scientist", don't suggest "Frontend Developer")

OUTPUT FORMAT (JSON only, no markdown):
{
  "roadmap": [
    {
      "label": "Now",
      "title": "Current Focus Area",
      "role": "Current role based on existing skills and experience level",
      "skills": ["skill1", "skill2", "skill3"],
      "color": "violet"
    },
    {
      "label": "6–12 months",
      "title": "Intermediate Milestone",
      "role": "Intermediate role progressing toward ${targetRole}",
      "skills": ["newskill1", "newskill2", "newskill3"],
      "color": "cyan"
    },
    {
      "label": "2–3 years",
      "title": "Target Achievement",
      "role": "${targetRole}",
      "skills": ["advancedskill1", "advancedskill2", "advancedskill3"],
      "color": "blue"
    }
  ]
}

Return ONLY the JSON object, no additional text.
`;

  try {
    const result = await model.generateContent(prompt);
    const raw = typeof result.response.text === 'function' 
      ? await result.response.text() 
      : String(result.response || '');

    // Clean the response
    let jsonText = raw.replace(/```json|```/g, '').trim();
    
    const start = jsonText.indexOf('{');
    const end = jsonText.lastIndexOf('}');
    if (start >= 0 && end > start) {
      jsonText = jsonText.slice(start, end + 1);
    }

    const parsed = JSON.parse(jsonText);
    
    // Validate structure
    if (!parsed.roadmap || !Array.isArray(parsed.roadmap) || parsed.roadmap.length === 0) {
      throw new Error('Invalid roadmap structure');
    }

    return parsed;
  } catch (err) {
    console.error('AI parsing error:', err);
    throw new Error('Failed to parse AI JSON output');
  }
}