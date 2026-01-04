import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        const models = await genAI.listModels();
        console.log("Available models:");
        models.forEach(model => {
            console.log(`- ${model.name}: ${model.description}`);
        });
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();