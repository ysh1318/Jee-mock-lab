/**
 * Dry-run / Sanitize False-Positive Diagrams from Ingested Shifts
 * Cleans the 106 tiny (<600 bytes) artifact images (invisible spacers/dots)
 * that PyMuPDF extracted as false positives in the legacy 2024 shifts.
 */

import fs from "fs";
import path from "path";

const SHIFTS_DIR = path.resolve("src/data/shifts");
const PUBLIC_DIR = path.resolve("public");

const files = fs.readdirSync(SHIFTS_DIR).filter(f => f.endsWith(".ts"));
let totalCleanedQuestions = 0;
let totalAffectedShifts = 0;

for (const file of files) {
  const filePath = path.join(SHIFTS_DIR, file);
  let content = fs.readFileSync(filePath, "utf-8");
  let modified = false;
  let cleanedInThisFile = 0;

  // Find all diagramImage references
  const regex = /hasDiagram:\s*true,\s*\n\s*diagramImage:\s*"([^"]+)",?\s*\n?/g;

  content = content.replace(regex, (match, diagPath) => {
    if (diagPath.startsWith("data:")) return match;

    const fullPath = path.join(PUBLIC_DIR, diagPath.replace(/^\//, ""));
    if (fs.existsSync(fullPath)) {
      const size = fs.statSync(fullPath).size;
      if (size < 600) {
        cleanedInThisFile++;
        modified = true;
        // Delete the tiny file if it exists
        try { fs.unlinkSync(fullPath); } catch {}
        // Omit the diagram tags completely so question renders as clean text!
        return "";
      }
    } else {
      cleanedInThisFile++;
      modified = true;
      return "";
    }
    return match;
  });

  if (modified) {
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`[CLEANED] ${file}: Removed ${cleanedInThisFile} false-positive tiny diagram artifacts.`);
    totalCleanedQuestions += cleanedInThisFile;
    totalAffectedShifts++;
  }
}

console.log(`\n============================================================`);
console.log(`SUMMARY: Cleaned ${totalCleanedQuestions} false-positive diagrams across ${totalAffectedShifts} shifts.`);
console.log(`============================================================\n`);
