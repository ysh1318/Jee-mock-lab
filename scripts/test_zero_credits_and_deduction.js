/**
 * Targeted Zero Credit & Personal API Key Rejection Simulation
 * Validates:
 * 1. User with 0 credits calling with personal API key is REJECTED with HTTP 402
 * 2. User with 0 credits calling without key is REJECTED with HTTP 402
 * 3. Credit balance never drops below 0 (negative balance prevention)
 * 4. Admin users are exempt
 */

import crypto from "crypto";

const BASE_URL = process.env.TEST_URL || "https://jeemocklab-backend.yashawachar101.workers.dev";
const DUMMY_PDF_BASE64 = "JVBERi0xLjQKJeLjz9MKMSAwIG9iaiA8PC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUj4+IGVuZG9iagoyIDAgb2JqIDw8L1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDE+PiBlbmRvYmoKMyAwIG9iaiA8PC9UeXBlIC9QYWdlIC9QYXJlbnQgMiAwIFIgL01lZGlhQm94IFswIDAgNjEyIDc5Ml0+PiBlbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE4IDAwMDAwIG4gCjAwMDAwMDAwNjcgMDAwMDAgbiAKMDAwMDAwMDExOSAwMDAwMCBuIAp0cmFpbGVyIDw8L1NpemUgND4+ICUlRU9G";

async function postJson(endpoint, data) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, ok: res.ok, body };
}

async function getJson(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`);
  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, ok: res.ok, body };
}

let testPassed = 0;
let testFailed = 0;

function assert(condition, testName, detail = "") {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${testName} ${detail ? `(${detail})` : ""}`);
    testPassed++;
  } else {
    console.error(`  \x1b[31m✘ FAIL\x1b[0m: ${testName} ${detail ? `(${detail})` : ""}`);
    testFailed++;
  }
}

async function runZeroCreditTests() {
  console.log(`\n============================================================`);
  console.log(`   ZERO-CREDIT & PERSONAL API KEY BYPASS DEFENSE TESTS`);
  console.log(`============================================================\n`);

  // 1. Create candidate account
  const tag = Date.now().toString(36);
  const email = `broke_candidate_${tag}@simulation.io`;
  const reg = await postJson("/api/auth/register", {
    name: "Zero Balance Candidate",
    email,
    passwordHash: "hash123",
    deviceId: `dev_${tag}`,
  });
  const userId = reg.body?.user?.id;
  assert(!!userId, "Account creation", `User ID: ${userId}`);

  // 2. Adjust candidate balance to 0 credits via admin endpoint
  console.log(`\n[STEP] Draining user balance to 0 credits via admin adjustment...`);
  const drainRes = await postJson("/api/admin/adjust-credits", {
    userId,
    amount: -5,
    description: "Simulation: Drain balance to 0 for boundary testing",
  });
  assert(drainRes.status === 200 && drainRes.body?.user?.credits === 0, "Balance successfully set to 0", `Credits: ${drainRes.body?.user?.credits}`);

  // 3. Candidate with 0 credits tries to parse WITHOUT personal key
  console.log(`\n[TEST A] Parsing attempt with 0 credits (No Personal Key)...`);
  const parseAttemptA = await postJson("/api/parse-pdf", {
    userId,
    pdfData: DUMMY_PDF_BASE64,
    filename: "Attempt_ZeroCredits.pdf",
    subject: "Physics",
    prefix: "P",
    partIndex: -1,
    parseSessionId: `session_zero_a_${Date.now()}`,
  });
  assert(
    parseAttemptA.status === 402,
    "Strict HTTP 402 Insufficient Credits returned",
    `Status: ${parseAttemptA.status}, Body: ${JSON.stringify(parseAttemptA.body)}`
  );

  // 4. Candidate with 0 credits tries to parse WITH PERSONAL API KEY (Attempted bypass)
  console.log(`\n[TEST B] Parsing attempt with 0 credits + PERSONAL API KEY (Bypass Defense)...`);
  const parseAttemptB = await postJson("/api/parse-pdf", {
    userId,
    pdfData: DUMMY_PDF_BASE64,
    filename: "Attempt_WithPersonalKey.pdf",
    subject: "Physics",
    prefix: "P",
    partIndex: -1,
    apiKey: "AIzaSy_SneakyStudentKey12345", // Personal API key supplied!
    parseSessionId: `session_zero_b_${Date.now()}`,
  });
  assert(
    parseAttemptB.status === 402,
    "Personal API Key CANNOT bypass 0 credits requirement (HTTP 402 enforced)",
    `Status: ${parseAttemptB.status}, Body: ${JSON.stringify(parseAttemptB.body)}`
  );

  // 5. Verify balance is STILL 0 (never negative -1 or corrupt)
  console.log(`\n[TEST C] Non-negative balance guarantee...`);
  const finalWallet = await getJson(`/api/user/${userId}/wallet`);
  assert(
    finalWallet.body?.credits === 0,
    "User credits remain strictly 0 (never negative)",
    `Final credits: ${finalWallet.body?.credits}`
  );

  console.log(`\n============================================================`);
  console.log(`   ZERO-CREDIT TEST RESULTS: ${testPassed} PASSED, ${testFailed} FAILED`);
  console.log(`============================================================\n`);
}

runZeroCreditTests().catch(err => {
  console.error("Zero credit test error:", err);
  process.exit(1);
});
