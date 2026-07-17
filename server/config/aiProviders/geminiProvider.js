// config/aiProviders/geminiProvider.js
import { model } from "../gemini.js";

async function generateContent(prompt) {
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export default { generateContent };