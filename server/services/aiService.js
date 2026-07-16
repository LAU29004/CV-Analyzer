// services/aiService.js
import AppSettings from "../models/AppSettings.js";
import { getProvider } from "../config/aiProviders/index.js";

let cachedModel = null;
let cacheExpiry = 0;

async function getActiveModelName() {
  const now = Date.now();
  if (cachedModel && now < cacheExpiry) return cachedModel;

  const settings = await AppSettings.findOne({ key: "global" });
  cachedModel = settings?.activeModel || "Gemini";
  cacheExpiry = now + 30_000; // cache 30s, avoids a DB hit on every request
  return cachedModel;
}

export async function generateContent(prompt) {
  const modelName = await getActiveModelName();
  const provider = getProvider(modelName);
  return provider.generateContent(prompt);
}

export function invalidateModelCache() {
  cachedModel = null;
}