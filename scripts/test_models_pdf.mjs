import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Read first page of test PDF
const pdfBase64 = fs.readFileSync("jee mains shifts raw pdfs/2026 jan/9. 28-01-2026_S1.pdf").toString("base64");

const models = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-3.5-flash",
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-pro-latest",
  "gemini-2.0-flash-lite"
];

for (const m of models) {
  console.log(`Testing model: ${m}...`);
  try {
    const res = await ai.models.generateContent({
      model: m,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "application/pdf", data: pdfBase64 } },
            { text: "What is the title printed at the top of page 1? Reply in 1 sentence." }
          ]
        }
      ]
    });
    console.log(`>>> SUCCESS on ${m}:`, res.text.trim());
    break;
  } catch (err) {
    console.log(`>>> FAILED on ${m}:`, err.message.slice(0, 100));
  }
}
