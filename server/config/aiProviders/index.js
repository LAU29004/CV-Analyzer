// config/aiProviders/index.js
import gemini from "./geminiProvider.js";
import openai from "./openaiProvider.js";
import groq from "./groqProvider.js";

const providers = { Gemini: gemini, ChatGPT: openai, Groq: groq };

export function getProvider(modelName) {
  return providers[modelName] || providers.Gemini;
}