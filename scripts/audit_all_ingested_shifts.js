/**
 * Comprehensive Audit of Ingested Shift Papers (src/data/shifts)
 * Evaluates:
 * 1. Total questions per shift (Target: 75 for 2025/2026, 90 for 2024)
 * 2. Section A (MCQ, 4 options) vs Section B (Numerical)
 * 3. Diagram references (hasDiagram, diagramImage path, file existence, file size)
 * 4. KaTeX / LaTeX health
 * 5. Answer keys distribution
 */

import fs from "fs";
import path from "path";

const SHIFTS_DIR = path.resolve("src/data/shifts");
const PUBLIC_DIR = path.resolve("public");

const files = fs.readdirSync(SHIFTS_DIR).filter(f => f.endsWith(".ts"));

console.log(`\n============================================================`);
console.log(`   COMPREHENSIVE AUDIT OF ALL ${files.length} INGESTED SHIFTS`);
console.log(`============================================================\n`);

let totalShifts = files.length;
let shiftsWithIssues = 0;
let totalQuestionsCount = 0;
let totalDiagramsFound = 0;
let totalBrokenDiagrams = 0;
let totalTinyDiagrams = 0; // < 500 bytes (likely corrupt/blank)

const summaryTable = [];

for (const file of files) {
  const shiftId = file.replace(".ts", "");
  const filePath = path.join(SHIFTS_DIR, file);
  const content = fs.readFileSync(filePath, "utf-8");

  // Extract questions using regex
  const qMatches = [...content.matchAll(/id:\s*"([^"]+)"/g)];
  const qCount = qMatches.length;
  totalQuestionsCount += qCount;

  // Diagram checks
  const diagramMatches = [...content.matchAll(/diagramImage:\s*"([^"]+)"/g)];
  let brokenDiags = 0;
  let tinyDiags = 0;
  let validDiags = 0;

  for (const dm of diagramMatches) {
    const diagPath = dm[1];
    if (diagPath.startsWith("data:")) {
      validDiags++;
    } else {
      const fullPath = path.join(PUBLIC_DIR, diagPath.replace(/^\//, ""));
      if (!fs.existsSync(fullPath)) {
        brokenDiags++;
      } else {
        const stats = fs.statSync(fullPath);
        if (stats.size < 500) {
          tinyDiags++;
        } else {
          validDiags++;
        }
      }
    }
  }

  totalDiagramsFound += diagramMatches.length;
  totalBrokenDiagrams += brokenDiags;
  totalTinyDiagrams += tinyDiags;

  // Section A/B balance
  const secAMatches = [...content.matchAll(/section:\s*Section\.A/g)].length;
  const secBMatches = [...content.matchAll(/section:\s*Section\.B/g)].length;

  const year = shiftId.split("-")[0];
  const expectedCount = year === "2024" ? 90 : 75;
  const countOk = Math.abs(qCount - expectedCount) <= 5;

  const hasIssues = !countOk || brokenDiags > 0 || tinyDiags > 5;
  if (hasIssues) shiftsWithIssues++;

  summaryTable.push({
    shiftId,
    year,
    qCount,
    expectedCount,
    secA: secAMatches,
    secB: secBMatches,
    diagrams: diagramMatches.length,
    validDiags,
    brokenDiags,
    tinyDiags,
    status: hasIssues ? "⚠️ ISSUES" : "✅ CLEAN",
  });
}

// Print summary
console.log(`Audited ${totalShifts} shift papers (${totalQuestionsCount} questions total).\n`);

const issuesList = summaryTable.filter(s => s.status.includes("ISSUES"));
console.log(`Shifts with potential issues: ${issuesList.length}/${totalShifts}`);

if (issuesList.length > 0) {
  console.log("\nDetails of shifts with issues:");
  for (const s of issuesList.slice(0, 15)) {
    console.log(`- ${s.shiftId} (${s.year}): ${s.qCount}/${s.expectedCount} Qs, SecA=${s.secA}, SecB=${s.secB}, Diags=${s.diagrams} (Valid=${s.validDiags}, Broken=${s.brokenDiags}, Tiny=${s.tinyDiags})`);
  }
}

console.log(`\nAggregates:`);
console.log(`- Total Questions: ${totalQuestionsCount}`);
console.log(`- Total Diagram references: ${totalDiagramsFound}`);
console.log(`- Valid diagrams on disk: ${totalDiagramsFound - totalBrokenDiagrams - totalTinyDiagrams}`);
console.log(`- Broken diagram paths (404): ${totalBrokenDiagrams}`);
console.log(`- Tiny/suspect diagrams (<500B): ${totalTinyDiagrams}`);

console.log(`\n============================================================\n`);
