import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { retry } from "../utils/retry.js";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is not set in .env file");
  process.exit(1);
}

console.log("✅ Gemini API Key loaded");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const GEMINI_MIN_INTERVAL_MS = Number(
  process.env.GEMINI_MIN_INTERVAL_MS || 1200
);

let geminiQueue = Promise.resolve();
let lastGeminiRequestAt = 0;

export const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  generationConfig: {
    temperature: 0.7,
    responseMimeType: "application/json",
  },
});

export const generateGeminiContent = async (...args) => {
  const run = async () => {
    const elapsed = Date.now() - lastGeminiRequestAt;
    if (elapsed < GEMINI_MIN_INTERVAL_MS) {
      await sleep(GEMINI_MIN_INTERVAL_MS - elapsed);
    }

    lastGeminiRequestAt = Date.now();
    return retry(() => model.generateContent(...args));
  };

  const scheduled = geminiQueue.then(run, run);
  geminiQueue = scheduled.catch(() => {});
  return scheduled;
};
