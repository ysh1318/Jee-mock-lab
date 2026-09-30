# Firestore Security Specification and TDD Plan

This specification defines the security invariants, unauthorized ("Dirty Dozen") payloads, and validation criteria for the JEE-Pro Computer Based Test (CBT) platform.

## 1. Data Invariants
- **Identity Integrity**: Users can only read and write their own `/users/{userId}` documents. They cannot alter or read other users' accounts.
- **RBAC Security**: Only the absolute administrator (`dadapajiop@gmail.com` with a verified email) can elevate permissions, manually adjust credit balances, or approve purchase requests. Users cannot modify their own `role` or `credits` fields via the client SDK.
- **Purchase Ledger Invariance**: Users can submit purchase requests (`/purchaseRequests/{requestId}`) containing their own ID, but once a purchase request is submitted, only admins can change its status to `approved` or `declined`.
- **Credit Log Immutability**: Historical logs (`/users/{userId}/transactions/{transactionId}`) record audit trails. They are read-only for the candidate and writable only via secure admin paths or authenticated backend executions.
- **Temporal Integrity**: All timestamp fields (`createdAt`, `updatedAt`, `purchaseDate`) must be strictly synchronized and validated against `request.time`.

---

## 2. The "Dirty Dozen" Payloads (Aesthetic Penetration Testing)

Below are the 12 specific payloads representing unauthorized states designed to bypass security. A secure ruleset must throw `PERMISSION_DENIED` for all:

1. **Self-Elevated Admin Attack**
   - *Target*: Create or update `/users/attacker_id`
   - *Payload*: `{"id": "attacker_id", "email": "attacker@gmail.com", "name": "Attacker", "credits": 3, "role": "admin"}`
   - *Violation*: Setting `role` to `admin` without proper credentials.

2. **Credit Injection Spoof**
   - *Target*: Update `/users/attacker_id`
   - *Payload*: `{"credits": 9999}`
   - *Violation*: Overwriting own credit balance from the client-side.

3. **Email Spoofing Attack**
   - *Target*: Read/Write admin data using forged email string
   - *Request Auth*: `{"uid": "attacker_id", "token": {"email": "dadapajiop@gmail.com", "email_verified": false}}`
   - *Violation*: Mimicking administrative identity without verified email status.

4. **Shadow Field Injection**
   - *Target*: Create `/users/attacker_id`
   - *Payload*: `{"id": "attacker_id", "email": "attacker@gmail.com", "name": "Attacker", "credits": 3, "ghost_field_exploited": true}`
   - *Violation*: Injecting unwhitelisted properties (shadow fields) bypassing schema requirements.

5. **Self-Approve Purchase Request**
   - *Target*: Update `/purchaseRequests/order_abc`
   - *Payload*: `{"status": "approved", "approvedAt": "2026-06-05T08:00:00Z"}`
   - *Violation*: Regular user modifying status field of their own payment request.

6. **Impersonated Purchase Submission**
   - *Target*: Create `/purchaseRequests/order_fake`
   - *Payload*: `{"id": "order_fake", "userId": "victim_user_id", "userEmail": "victim@gmail.com", "pack": "50_credits", "amount": 99, "status": "verifying"}`
   - *Violation*: Placing orders on behalf of another user account.

7. **Orphaned Credit Transaction Log**
   - *Target*: Create `/users/attacker_id/transactions/tx_fake`
   - *Payload*: `{"id": "tx_fake", "userId": "attacker_id", "amount": 50, "type": "purchase_grant", "description": "Free Credits Hack"}`
   - *Violation*: Client fabricating transactional history logs to force balance increments.

8. **Future Timestamp Poisoning**
   - *Target*: Create `/users/attacker_id`
   - *Payload*: `{"id": "attacker_id", "email": "attacker@gmail.com", "credits": 3, "createdAt": "2030-01-01T00:00:00Z"}`
   - *Violation*: Bypassing server timestamp constraints using client-forged timestamps.

9. **Long ID Denial-of-Wallet (PII Poisoning)**
   - *Target*: Create document at `/users/over_128_char_id_key_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`
   - *Violation*: Attempting resource exhaustion by using a key length exceeding 128 characters.

10. **Terminal State Lockdown Bypass**
    - *Target*: Update `/purchaseRequests/order_cleared` (already approved)
    - *Payload*: `{"status": "pending", "utrNumber": "123456789012"}`
    - *Violation*: Overwriting transaction history that has already reached a finalized/terminal state.

11. **Blanket Query Scraping Attack**
    - *Target*: Global list query `/users`
    - *Payload*: Fetching all user profiles without a limiting filter on the `id` or `owner` field.
    - *Violation*: Fetching personal information of other candidates.

12. **Sub-Collection Parent Bypass**
    - *Target*: Create `/users/non_existent_user/transactions/tx_1`
    - *Violation*: Writing transaction logs under a non-existent parent user account (orphaned log).

---

## 3. The Test Suite Configuration (`firestore.rules.test.ts`)

Applications can run localized integration test cases. Below is the blueprint of tests validating that these exact scenarios yield strict `PERMISSION_DENIED`:

```typescript
import { 
  initializeTestEnvironment, 
  RulesTestEnvironment 
} from "@firebase/rules-unit-testing";
import { 
  setDoc, 
  getDoc, 
  collection, 
  doc 
} from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "bustling-zucchini-rtxfk",
    firestore: {
      rules: require("fs").readFileSync("firestore.rules", "utf8")
    }
  });
});

test("Attacker cannot escalate role to admin", async () => {
  const aliceDb = testEnv.authenticatedContext("alice").firestore();
  await expect(
    setDoc(doc(aliceDb, "users", "alice"), {
      uid: "alice",
      email: "alice@student.in",
      credits: 3,
      role: "admin"
    })
  ).rejects.toThrow("PERMISSION_DENIED");
});

test("Attacker cannot modify credits directly", async () => {
  const aliceDb = testEnv.authenticatedContext("alice").firestore();
  await expect(
    setDoc(doc(aliceDb, "users", "alice"), {
      credits: 9999
    }, { merge: true })
  ).rejects.toThrow("PERMISSION_DENIED");
});
```
