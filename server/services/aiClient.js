import { model as geminiModel } from "../config/gemini.js";
import AppSettings from "../models/AppSettings.js";
import OpenAI from "openai";
import Groq from "groq-sdk";

let cachedModelName = null;
let cacheExpiry = 0;

async function getActiveModelName() {
  const now = Date.now();
  if (cachedModelName && now < cacheExpiry) return cachedModelName;

  const settings = await AppSettings.findOne({ key: "global" });
  cachedModelName = settings?.activeModel || "Gemini";
  cacheExpiry = now + 30_000; // 30s cache, avoids a DB hit on every AI call
  return cachedModelName;
}

export function invalidateModelCache() {
  cachedModelName = null;
}

const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const groqClient = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

// Wraps an OpenAI-compatible chat client so it exposes the same
// `.generateContent(prompt) -> { response: { text: () => string } }`
// shape that every existing file already expects from Gemini.
function wrapChatCompletionClient(client, modelId) {
  return {
    generateContent: async (prompt) => {
      const completion = await client.chat.completions.create({
        model: modelId,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        // NOTE: OpenAI/Groq's json_object mode requires the word "json"
        // to appear somewhere in the prompt — all your current prompts
        // already say "Return ONLY a JSON..." etc, so this is satisfied.
      });
      const text = completion.choices[0].message.content;
      return { response: { text: () => text } };
    },
  };
}

/**
 * Returns a model client matching Gemini's interface, based on whatever
 * the admin currently has set as the active provider in AppSettings.
 * Drop-in replacement for `import { model } from '../config/gemini.js'`.
 */
export async function getActiveModelClient() {
  const name = await getActiveModelName();

  if (name === "ChatGPT") {
    if (!openaiClient) throw new Error("OPENAI_API_KEY is not set");
    return wrapChatCompletionClient(openaiClient, "gpt-4o-mini");
  }

  if (name === "Groq") {
    if (!groqClient) throw new Error("GROQ_API_KEY is not set");
    return wrapChatCompletionClient(groqClient, "llama-3.3-70b-versatile");
  }

  return geminiModel; // Gemini — native shape, no wrapping needed
}