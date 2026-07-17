// config/aiProviders/groqProvider.js
import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function generateContent(prompt) {
  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });
  return completion.choices[0].message.content;
}

export default { generateContent };