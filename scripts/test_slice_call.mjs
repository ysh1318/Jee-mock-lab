import { GoogleGenAI } from "@google/genai";
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  const fileBytes = fs.readFileSync("jee mains shifts raw pdfs/2026 jan/9. 28-01-2026_S1.pdf");
  const pdfDoc = await PDFDocument.load(fileBytes);
  const subDoc = await PDFDocument.create();
  // Copy only page 4 (first physics page)
  const copied = await subDoc.copyPages(pdfDoc, [3]);
  copied.forEach(p => subDoc.addPage(p));
  const subBytes = await subDoc.save();
  const pdfBase64 = Buffer.from(subBytes).toString("base64");
  console.log("Sliced 1 page, base64 length:", pdfBase64.length);

  console.log("Sending to gemini-3.5-flash...");
  const t0 = Date.now();
  const res = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: "application/pdf", data: pdfBase64 } },
          { text: "Extract questions on this page in JSON with keys: questionNumber, questionText." }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json"
    }
  });

  console.log(`Received in ${((Date.now() - t0)/1000).toFixed(1)}s!`);
  console.log("Output preview:", res.text.slice(0, 200));
}

run().catch(console.error);
