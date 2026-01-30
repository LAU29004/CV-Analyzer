import { createRequire } from "module";
import mammoth from "mammoth";
import { ENABLE_AI } from "../config/env.js";
import { safeAI } from "../utils/safeAI.js";
import { retry } from "../utils/retry.js";
import { model } from "../config/gemini.js";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

export const analyzeResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    let text = "";
    if (req.file.mimetype === "application/pdf") {
      const parser = new PDFParse({ data: req.file.buffer });
      const pdf = await parser.getText();
      await parser.destroy();
      text = pdf.text;
    } else {
      text = (await mammoth.extractRawText({ buffer: req.file.buffer })).value;
    }

    const fallback = {
      analysis: {
        strengths: ["Resume extracted successfully"],
        weaknesses: ["AI skipped due to quota or invalid response"]
      },
      optimizedResume: { note: "Resume ready for formatting" }
    };

    const result = ENABLE_AI
      ? await safeAI(
          async () => {
            const prompt = `
Improve formatting and wording only.
Return STRICT JSON.

RESUME:
${text}
`;
            const r = await retry(() => model.generateContent(prompt));
            return JSON.parse(
              (await r.response.text()).replace(/```json|```/g, "")
            );
          },
          () => fallback
        )
      : fallback;

    res.json(result);
  } catch {
    res.status(500).json({ error: "Resume analysis failed" });
  }
};
