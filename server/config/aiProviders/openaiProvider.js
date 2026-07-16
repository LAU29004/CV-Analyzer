// config/aiProviders/openaiProvider.js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateContent(prompt) {
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }, // matches your Gemini responseMimeType: json config
  });
  return completion.choices[0].message.content;
}

export default { generateContent };