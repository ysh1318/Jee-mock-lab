import { GoogleGenAI } from "@google/genai";
import { execSync } from "child_process";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Render Page 4 (Physics start) as JPEG using PyMuPDF
execSync(`python -c "import pymupdf; doc = pymupdf.open('jee mains shifts raw pdfs/2026 jan/9. 28-01-2026_S1.pdf'); doc[3].get_pixmap(dpi=130).save('scratch/test_page4.jpg')"`);

const imgBytes = fs.readFileSync("scratch/test_page4.jpg").toString("base64");
console.log("Rendered page image size in KB:", (imgBytes.length * 0.75) / 1024);

console.log("Sending page image to gemini-3.5-flash...");
const t0 = Date.now();
const res = await ai.models.generateContent({
  model: "gemini-3.5-flash",
  contents: [
    {
      role: "user",
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: imgBytes } },
        { text: "Read the questions on this page and extract the question numbers and first sentence of each question in JSON." }
      ]
    }
  ],
  config: {
    responseMimeType: "application/json"
  }
});

console.log(`SUCCESS in ${((Date.now() - t0)/1000).toFixed(1)}s!`);
console.log("Response:", res.text);
