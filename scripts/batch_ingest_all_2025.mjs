import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const SHIFTS_TO_INGEST = [
  // Jan 2025 (10 shifts)
  { pdf: "jee mains shifts raw pdfs/2025 jan/1. 22-01-2025_S1.pdf", id: "2025-jan-22-s1" },
  { pdf: "jee mains shifts raw pdfs/2025 jan/2. 22-01-2025_S2.pdf", id: "2025-jan-22-s2" },
  { pdf: "jee mains shifts raw pdfs/2025 jan/3. 23-01-2025_S1.pdf", id: "2025-jan-23-s1" },
  { pdf: "jee mains shifts raw pdfs/2025 jan/4. 23-01-2025_S2.pdf", id: "2025-jan-23-s2" },
  { pdf: "jee mains shifts raw pdfs/2025 jan/5. 24-01-2025_S1.pdf", id: "2025-jan-24-s1" },
  { pdf: "jee mains shifts raw pdfs/2025 jan/6. 24-01-2025_S2.pdf", id: "2025-jan-24-s2" },
  { pdf: "jee mains shifts raw pdfs/2025 jan/7. 28-01-2025_S1.pdf", id: "2025-jan-28-s1" },
  { pdf: "jee mains shifts raw pdfs/2025 jan/8. 28-01-2025_S2.pdf", id: "2025-jan-28-s2" },
  { pdf: "jee mains shifts raw pdfs/2025 jan/9. 29-01-2025_S1.pdf", id: "2025-jan-29-s1" },
  { pdf: "jee mains shifts raw pdfs/2025 jan/10. 29-01-2025_S2.pdf", id: "2025-jan-29-s2" },

  // April 2025 (9 shifts)
  { pdf: "jee mains shifts raw pdfs/2025 april/1. 02-04-2025_S1.pdf", id: "2025-apr-02-s1" },
  { pdf: "jee mains shifts raw pdfs/2025 april/2. 02-04-2025_S2.pdf", id: "2025-apr-02-s2" },
  { pdf: "jee mains shifts raw pdfs/2025 april/3. 03-04-2025_S1.pdf", id: "2025-apr-03-s1" },
  { pdf: "jee mains shifts raw pdfs/2025 april/4. 03-04-2025_S2.pdf", id: "2025-apr-03-s2" },
  { pdf: "jee mains shifts raw pdfs/2025 april/5. 04-04-2025_S1.pdf", id: "2025-apr-04-s1" },
  { pdf: "jee mains shifts raw pdfs/2025 april/6. 04-04-2025_S2.pdf", id: "2025-apr-04-s2" },
  { pdf: "jee mains shifts raw pdfs/2025 april/7. 07-04-2025_S1.pdf", id: "2025-apr-07-s1" },
  { pdf: "jee mains shifts raw pdfs/2025 april/8. 07-04-2025_S2.pdf", id: "2025-apr-07-s2" },
  { pdf: "jee mains shifts raw pdfs/2025 april/9. 08-04-2025_S2.pdf", id: "2025-apr-08-s2" },
];

const force = process.argv.includes("--force");
const targetId = process.argv.find(a => a.startsWith("--id="))?.split("=")[1];

console.log(`\n======================================================`);
console.log(`BATCH INGESTION ENGINE: ALL 19 JEE MAIN 2025 SHIFTS`);
console.log(`Force Overwrite: ${force}`);
if (targetId) console.log(`Targeting Single Shift: ${targetId}`);
console.log(`======================================================\n`);

let processedCount = 0;
let skippedCount = 0;
let failedCount = 0;

async function runBatch() {
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
      execSync(`node scripts/universal_ingest_shift.mjs "${item.pdf}" "${item.id}" "${targetTs}"`, {
        stdio: "inherit"
      });
      processedCount++;
      console.log(`>>> SUCCESS: Finished ${item.id}!\n`);
      await new Promise(r => setTimeout(r, 4000));
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
}

runBatch();
