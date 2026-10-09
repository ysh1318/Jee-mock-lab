import fs from "fs";
import path from "path";
import { universalIngest } from "./universal_ingest_shift.mjs";

const SHIFTS_2024 = [
  // January Shifts (Motion Education)
  { id: "2024-jan-27-s1", folder: "2024 jan" }, // already ingested
  { id: "2024-jan-27-s2", folder: "2024 jan" },
  { id: "2024-jan-29-s1", folder: "2024 jan" },
  { id: "2024-jan-29-s2", folder: "2024 jan" },
  { id: "2024-jan-30-s1", folder: "2024 jan" },
  { id: "2024-jan-30-s2", folder: "2024 jan" }, // already ingested
  { id: "2024-jan-31-s1", folder: "2024 jan" },
  { id: "2024-jan-31-s2", folder: "2024 jan" },
  { id: "2024-feb-01-s1", folder: "2024 jan" },
  { id: "2024-feb-01-s2", folder: "2024 jan" },

  // April Shifts (Competishun)
  { id: "2024-apr-04-s1", folder: "2024 april" }, // already ingested
  { id: "2024-apr-04-s2", folder: "2024 april" },
  { id: "2024-apr-05-s1", folder: "2024 april" },
  { id: "2024-apr-05-s2", folder: "2024 april" },
  { id: "2024-apr-06-s1", folder: "2024 april" },
  { id: "2024-apr-06-s2", folder: "2024 april" },
  { id: "2024-apr-08-s1", folder: "2024 april" },
  { id: "2024-apr-08-s2", folder: "2024 april" },
  { id: "2024-apr-09-s1", folder: "2024 april" },
  { id: "2024-apr-09-s2", folder: "2024 april" }
];

async function main() {
  console.log("\n============================================================");
  console.log("JEE MAIN 2024 BATCH INGESTION (OLD_90 PATTERN • 20 SHIFTS)");
  console.log("Multi-Provider: Motion Education (Jan) + Competishun (Apr)");
  console.log("============================================================\n");

  const singleTarget = process.argv[2];
  const list = singleTarget 
    ? SHIFTS_2024.filter(s => s.id === singleTarget)
    : SHIFTS_2024;

  let completed = 0;
  let skipped = 0;
  let failed = 0;

  for (let idx = 0; idx < list.length; idx++) {
    const item = list[idx];
    const shiftId = item.id;
    const outputTs = path.resolve(`src/data/shifts/${shiftId}.ts`);
    const pdfPath = path.resolve(`jee mains shifts raw pdfs/${item.folder}/${shiftId}.pdf`);

    // Check if already ingested with 90 questions
    if (fs.existsSync(outputTs)) {
      const content = fs.readFileSync(outputTs, "utf-8");
      const match = content.match(/id:\s*"2024-[PCM]-\d{2}"/g) || content.match(/id:\s*"[^"]+"/g);
      if (match && match.length >= 85) {
        console.log(`[${idx + 1}/${list.length}] ⏭️ SKIP: ${shiftId} is already ingested (${match.length} questions).`);
        skipped++;
        continue;
      }
    }

    if (!fs.existsSync(pdfPath)) {
      console.error(`[${idx + 1}/${list.length}] ❌ ERROR: Raw PDF not found: ${pdfPath}`);
      failed++;
      continue;
    }

    console.log(`\n============================================================`);
    console.log(`[${idx + 1}/${list.length}] STARTING INGESTION: ${shiftId}`);
    console.log(`============================================================`);

    try {
      await universalIngest(pdfPath, shiftId, outputTs);
      completed++;
      console.log(`\n[${idx + 1}/${list.length}] ✅ COMPLETED: ${shiftId}`);
      // Safety cooling pause between shifts
      await new Promise(r => setTimeout(r, 4000));
    } catch (err) {
      console.error(`[${idx + 1}/${list.length}] ❌ FAILED ${shiftId}:`, err);
      failed++;
    }
  }

  console.log("\n============================================================");
  console.log("BATCH INGESTION COMPLETE!");
  console.log(`Completed: ${completed}, Skipped: ${skipped}, Failed: ${failed}, Total: ${list.length}`);
  console.log("============================================================\n");
}

main().catch(err => {
  console.error("FATAL BATCH ERROR:", err);
  process.exit(1);
});
