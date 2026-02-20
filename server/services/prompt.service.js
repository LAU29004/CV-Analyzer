// prompt.service.js
export const buildInterviewPrompt = ({
  jobRole,
  jobDescription,
  experienceLevel,
  questionTypes,
}) => {
  return `
You are a senior technical interviewer at a top MNC.

Generate 15 high-quality interview questions for the following role.

Job Role: ${jobRole}
Experience Level: ${experienceLevel}
Job Description: ${jobDescription}

Allowed Question Types: ${questionTypes.map((t) => t.toUpperCase()).join(", ")}

STRICT RULES:
- Generate ONLY the question types listed above.
- Return ONLY a valid JSON object. No explanation, no markdown, no code fences.
- All string values must use plain text only. Do NOT include newlines, tabs, or backslashes inside any string value.
- For coding answers, describe the logic in plain English instead of writing actual code with backslashes or special characters.

Output format (return ONLY this, nothing else):
{
  "questions": [
    {
      "type": "technical",
      "difficulty": "Easy | Medium | Hard",
      "question": "Question text here",
      "answer": "Detailed model answer in plain text",
      "follow_up": "A follow-up question"
    }
  ]
}
`;
};