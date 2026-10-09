import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const SHIFTS_TO_INGEST = [
  // Jan 2026 (10 shifts)
  { pdf: "jee mains shifts raw pdfs/2026 jan/1. 21-01-2026_S1.pdf", id: "2026-jan-21-s1" },
  { pdf: "jee mains shifts raw pdfs/2026 jan/2. 21-01-2026_S2.pdf", id: "2026-jan-21-s2" },
  { pdf: "jee mains shifts raw pdfs/2026 jan/3. 22-01-2026_S1.pdf", id: "2026-jan-22-s1" },
  { pdf: "jee mains shifts raw pdfs/2026 jan/4. 22-01-2026_S2.pdf", id: "2026-jan-22-s2" },
  { pdf: "jee mains shifts raw pdfs/2026 jan/5. 23-01-2026_S1.pdf", id: "2026-jan-23-s1" },
  { pdf: "jee mains shifts raw pdfs/2026 jan/6. 23-01-2026_S2.pdf", id: "2026-jan-23-s2" },
  { pdf: "jee mains shifts raw pdfs/2026 jan/7. 24-01-2026_S1.pdf", id: "2026-jan-24-s1" },
  { pdf: "jee mains shifts raw pdfs/2026 jan/8. 24-01-2026_S2.pdf", id: "2026-jan-24-s2" },
  { pdf: "jee mains shifts raw pdfs/2026 jan/9. 28-01-2026_S1.pdf", id: "2026-jan-28-s1" },
  { pdf: "jee mains shifts raw pdfs/2026 jan/10. 28-01-2026_S2.pdf", id: "2026-jan-28-s2" },

  // April 2026 (8 shifts)
  { pdf: "jee mains shifts raw pdfs/2026 april/1. 02-04-2025_S1.pdf", id: "2026-apr-02-s1" },
  { pdf: "jee mains shifts raw pdfs/2026 april/2. 02-04-2025_S2.pdf", id: "2026-apr-02-s2" },
  { pdf: "jee mains shifts raw pdfs/2026 april/3. 04-04-2025_S1.pdf", id: "2026-apr-04-s1" },
  { pdf: "jee mains shifts raw pdfs/2026 april/4. 04-04-2025_S2.pdf", id: "2026-apr-04-s2" },
  { pdf: "jee mains shifts raw pdfs/2026 april/5. 05-04-2025_S1.pdf", id: "2026-apr-05-s1" },
  { pdf: "jee mains shifts raw pdfs/2026 april/6. 05-04-2025_S2.pdf", id: "2026-apr-05-s2" },
  { pdf: "jee mains shifts raw pdfs/2026 april/7. 06-04-2025_S1.pdf", id: "2026-apr-06-s1" },
  { pdf: "jee mains shifts raw pdfs/2026 april/9. 08-04-2025_S2.pdf", id: "2026-apr-08-s2" },
];

const force = process.argv.includes("--force");
const targetId = process.argv.find(a => a.startsWith("--id="))?.split("=")[1];

console.log(`\n======================================================`);
console.log(`BATCH INGESTION ENGINE: ALL 18 JEE MAIN 2026 SHIFTS`);
console.log(`Force Overwrite: ${force}`);
if (targetId) console.log(`Targeting Single Shift: ${targetId}`);
console.log(`======================================================\n`);

let processedCount = 0;
let skippedCount = 0;
let failedCount = 0;

for (let i = 0; i < SHIFTS_TO_INGEST.length; i++) {
  const item = SHIFTS_TO_INGEST[i];
  if (targetId && item.id !== targetId) continue;

  const targetTs = path.join("src", "data", "shifts", `${item.id}.ts`);
  const exists = fs.existsSync(targetTs);

  if (exists && !force) {
    console.log(`[${i + 1}/${SHIFTS_TO_INGEST.length}] SKIP: ${item.id} already exists (${targetTs}). Use --force to re-ingest.`);
    skippedCount++;
    continue;
  }

  console.log(`\n------------------------------------------------------`);
  console.log(`[${i + 1}/${SHIFTS_TO_INGEST.length}] INGESTING: ${item.id} (${item.pdf})`);
  console.log(`------------------------------------------------------`);

  try {
    execSync(`node scripts/hybrid_ingest_shift.mjs "${item.pdf}" "${item.id}" "${targetTs}"`, {
      stdio: "inherit"
    });
    processedCount++;
    console.log(`>>> SUCCESS: Finished ${item.id}!\n`);
  } catch (err) {
    console.error(`>>> FAILED on ${item.id}:`, err.message);
    failedCount++;
  }
}

console.log(`\n======================================================`);
console.log(`BATCH INGESTION SUMMARY:`);
console.log(`  Processed: ${processedCount}`);
console.log(`  Skipped:   ${skippedCount}`);
console.log(`  Failed:    ${failedCount}`);
console.log(`======================================================\n`);
