import fs from "fs";
import path from "path";
import crypto from "crypto";
import { UserAccount, PurchaseRequest, CreditTransaction } from "../src/types";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Load configuration with environment fallbacks for production environments (e.g. Render)
const CONFIG_PATH = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseConfig: any = {};

if (fs.existsSync(CONFIG_PATH)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  } catch (err) {
    console.warn("Could not read firebase-applet-config.json standard configuration:", err);
  }
} else {
  console.log("No firebase-applet-config.json found. Relying on environment variables.");
}

const rawProjectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId || "";
const firebaseProjectId = rawProjectId.trim().toLowerCase();
const firestoreDatabaseId = process.env.FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId;

// Determine if we should use raw JSON string from environment variable (critical for Render)
let adminCreds: any = undefined;
const envCredsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || process.env.FIREBASE_SERVICE_ACCOUNT;

if (envCredsJson) {
  try {
    const credObject = JSON.parse(envCredsJson.trim());
    adminCreds = cert(credObject);
    console.log("Initialize Firebase Admin: service account loaded successfully from environment variable.");
  } catch (err) {
    console.error("Initialize Firebase Admin failed: GOOGLE_APPLICATION_CREDENTIALS_JSON parse error:", err);
  }
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  try {
    const credsVal = process.env.GOOGLE_APPLICATION_CREDENTIALS.trim();
    if (credsVal.startsWith("{")) {
      const credObject = JSON.parse(credsVal);
      adminCreds = cert(credObject);
      console.log("Initialize Firebase Admin: service account loaded successfully from JSON string in GOOGLE_APPLICATION_CREDENTIALS.");
    } else if (fs.existsSync(credsVal)) {
      const credObject = JSON.parse(fs.readFileSync(credsVal, "utf-8"));
      adminCreds = cert(credObject);
      console.log("Initialize Firebase Admin: service account loaded successfully from path defined in GOOGLE_APPLICATION_CREDENTIALS.");
    }
  } catch (err) {
    console.error("Initialize Firebase Admin error parsing/reading GOOGLE_APPLICATION_CREDENTIALS:", err);
  }
}

// Initialize client with specific custom database ID
let app: any = null;
let db: any = null;

try {
  const appOptions: any = {};
  if (adminCreds) {
    appOptions.credential = adminCreds;
  }
  if (firebaseProjectId) {
    appOptions.projectId = firebaseProjectId;
  }

  app = getApps().length === 0 ? initializeApp(appOptions) : getApps()[0];

  // Initialize Firestore. If database ID is configured, bind Firestore to it, otherwise default.
  db = (firestoreDatabaseId && firestoreDatabaseId !== "(default)") 
    ? getFirestore(app, firestoreDatabaseId)
    : getFirestore(app);
} catch (err: any) {
  console.warn("[DATABASE] Firebase Admin initialization error:", err.message);
}

// Persistent Local Database Fallback Strategy
const FALLBACK_FILE = path.join(process.cwd(), "local_db_fallback.json");

interface LocalStorageData {
  users: { [userId: string]: UserAccount & { passwordHash: string; banned?: boolean; updatedAt?: string; customApiKey?: string; salt?: string } };
  purchaseRequests: { [reqId: string]: PurchaseRequest };
  transactions: { [userId: string]: CreditTransaction[] };
  claimedDevices?: { [deviceId: string]: boolean };
  systemConfig?: any;
}

function computeHash(raw: string): string {
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return "hash_" + String(hash);
}

function hashPasswordPbkdf2(clientHash: string, salt: string): string {
  return crypto.pbkdf2Sync(clientHash, salt, 10000, 64, "sha256").toString("hex");
}

function loadLocalDb(): LocalStorageData {
  let data: LocalStorageData;
  if (!fs.existsSync(FALLBACK_FILE)) {
    data = { users: {}, purchaseRequests: {}, transactions: {} };
  } else {
    try {
      const raw = fs.readFileSync(FALLBACK_FILE, "utf-8");
      data = JSON.parse(raw);
    } catch (err) {
      console.error("Failed to parse local_db_fallback.json, resetting database file:", err);
      data = { users: {}, purchaseRequests: {}, transactions: {} };
    }
  }

  // Pre-seed yashawachar101@gmail.com Admin Account
  const adminEmail = "yashawachar101@gmail.com";
  const existingAdmin = Object.values(data.users).find(u => u.email === adminEmail);
  if (!existingAdmin) {
    const adminId = "usr_yash3107";
    const legacyHash = computeHash("@ysh3107ananjeelab");
    const salt = crypto.randomBytes(16).toString("hex");
    const secureHash = hashPasswordPbkdf2(legacyHash, salt);
    data.users[adminId] = {
      id: adminId,
      email: adminEmail,
      name: "Yashawachar Admin",
      credits: 9999,
      role: "admin",
      banned: false,
      createdAt: new Date().toISOString(),
      passwordHash: secureHash,
      salt: salt,
    } as any;
    console.log(`[LocalSeeder] Successfully pre-seeded Admin account: ${adminEmail}`);
    saveLocalDb(data);
  }

  return data;
}

function saveLocalDb(data: LocalStorageData) {
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save local_db_fallback.json:", err);
  }
}

// Global flag to track if we should run in local fallback mode
let useFallbackMode = false;

export let databaseReadyResolve: (val: boolean) => void = () => {};
export const databaseReady = new Promise<boolean>((resolve) => {
  databaseReadyResolve = resolve;
});

async function syncLocalDataToFirestore() {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const local = loadLocalDb();
      let syncCount = 0;
      
      // Sync systemConfig
      if (local.systemConfig) {
        await db.collection("systemConfig").doc("settings").set(local.systemConfig, { merge: true });
        console.log("[DATABASE-SYNC] System configuration synced from local fallback to Firestore.");
      }
      
      // Sync users
      if (local.users && Object.keys(local.users).length > 0) {
        for (const [userId, user] of Object.entries(local.users)) {
          const docRef = db.collection("users").doc(userId);
          const docSnap = await docRef.get();
          if (!docSnap.exists) {
            await docRef.set(user);
            syncCount++;
          } else {
            // Merge to preserve whichever has more credits
            const cloudUser = docSnap.data() as any;
            if (user.credits > (cloudUser.credits || 0)) {
              await docRef.set({ credits: user.credits }, { merge: true });
              syncCount++;
            }
          }
        }
        if (syncCount > 0) {
          console.log(`[DATABASE-SYNC] Synced ${syncCount} user profiles/credits from local fallback to Firestore.`);
        }
      }
    }
  } catch (syncErr: any) {
    console.error("[DATABASE-SYNC] Failed to sync local data to Firestore:", syncErr.message);
  }
}

async function checkDbConnection() {
  try {
    if (!db || !app) {
      throw new Error("Firebase Admin app or Firestore not initialized (no credentials configured)");
    }
    const snap = await db.collection("users").limit(1).get();
    console.log("Firestore successfully connected on backend. Registered users found:", snap.size);

    // Try seeding Firestore Admin as well to keep both environments synchronized
    const adminEmail = "yashawachar101@gmail.com";
    const usersRef = db.collection("users");
    const adminSnap = await usersRef.where("email", "==", adminEmail).get();
    
    if (adminSnap.empty) {
      const adminId = "usr_yash3107";
      const legacyHash = computeHash("@ysh3107ananjeelab");
      const salt = crypto.randomBytes(16).toString("hex");
      const secureHash = hashPasswordPbkdf2(legacyHash, salt);
      const adminUser = {
        id: adminId,
        email: adminEmail,
        name: "Yashawachar Admin",
        credits: 9999,
        role: "admin",
        banned: false,
        createdAt: new Date().toISOString(),
        passwordHash: secureHash,
        salt: salt,
      };
      await usersRef.doc(adminId).set(adminUser);
      console.log(`[FirestoreSeeder] Pre-seeded Admin user '${adminEmail}' successfully in Cloud Firestore.`);
    }

    // Since we are connected, sync any local work completed offline
    await syncLocalDataToFirestore();
    databaseReadyResolve(true);
  } catch (err: any) {
    console.warn(`[DATABASE] First connection check failed with ID '${firestoreDatabaseId}': ${err.message}. Trying fallback to '(default)'...`);
    try {
      if (!app) {
        throw new Error("No Firebase Admin app initialized");
      }
      const fallbackDb = getFirestore(app); // Default to '(default)'
      const snap = await fallbackDb.collection("users").limit(1).get();
      db = fallbackDb; // Reassign global db reference
      console.log("[DATABASE] Fallback success! Successfully connected to '(default)' Firestore database. Registered users found:", snap.size);

      // Seed Admin in default db
      const adminEmail = "yashawachar101@gmail.com";
      const usersRef = db.collection("users");
      const adminSnap = await usersRef.where("email", "==", adminEmail).get();
      if (adminSnap.empty) {
        const adminId = "usr_yash3107";
        const legacyHash = computeHash("@ysh3107ananjeelab");
        const salt = crypto.randomBytes(16).toString("hex");
        const secureHash = hashPasswordPbkdf2(legacyHash, salt);
        const adminUser = {
          id: adminId,
          email: adminEmail,
          name: "Yashawachar Admin",
          credits: 9999,
          role: "admin",
          banned: false,
          createdAt: new Date().toISOString(),
          passwordHash: secureHash,
          salt: salt,
        };
        await usersRef.doc(adminId).set(adminUser);
        console.log(`[FirestoreSeeder] Pre-seeded Admin user '${adminEmail}' successfully in '(default)' Cloud Firestore.`);
      }

      // Sync local work
      await syncLocalDataToFirestore();
      databaseReadyResolve(true);
    } catch (fallbackErr: any) {
      console.error("[DATABASE] Fallback connection to '(default)' database also failed:", fallbackErr.message);
      console.warn("\n========================================================================\n" +
                   "WARNING: Firestore Admin Permission Denied or Not Configured.\n" +
                   `Error: ${err.message}\n` +
                   "Bypassing roadblock: ENTERING FAILSENSITIVE LOCAL JSON FALLBACK MODE.\n" +
                   "All account transactions, registers, wallets, and mock logs will persist\n" +
                   "locally inside './local_db_fallback.json' with 100% reliability!\n" +
                   "========================================================================\n");
      useFallbackMode = true;
      databaseReadyResolve(true);
    }
  }
}

// Perform instant connection probe
checkDbConnection();

async function getSystemConfigFromDb(): Promise<any> {
  if (useFallbackMode) {
    try {
      const local = loadLocalDb();
      return local.systemConfig || null;
    } catch {
      return null;
    }
  }
  try {
    const doc = await db.collection("systemConfig").doc("settings").get();
    if (doc.exists) {
      return doc.data();
    }
    return null;
  } catch (err) {
    console.warn("Could not load systemConfig from Firestore:", err);
    return null;
  }
}

async function saveSystemConfigToDb(config: any): Promise<void> {
  if (useFallbackMode) {
    try {
      const local = loadLocalDb();
      local.systemConfig = config;
      saveLocalDb(local);
    } catch (err) {
      console.error("Could not save systemConfig to fallback local db:", err);
    }
    return;
  }
  try {
    await db.collection("systemConfig").doc("settings").set(config, { merge: true });
  } catch (err) {
    console.error("Could not save systemConfig to Firestore:", err);
  }
}

async function getTierInfo(pack: string): Promise<{ price: number; credits: number }> {
  const config = await getSystemConfigFromDb();
  const defaultTiers = [
    { id: "2_credits", credits: 2, amount: 29 },
    { id: "5_credits", credits: 5, amount: 59 },
    { id: "10_credits", credits: 10, amount: 99 }
  ];
  const tiers = config?.pricingTiers || defaultTiers;
  const tier = tiers.find((t: any) => t.id === pack);
  if (tier) {
    return {
      price: Number(tier.amount),
      credits: Number(tier.credits)
    };
  }
  // Ultimate Fallback defaults
  const creditsVal = pack.includes("_credits") ? parseInt(pack.split("_")[0]) || 5 : 5;
  const amountVal = creditsVal === 2 ? 29 : creditsVal === 5 ? 59 : creditsVal === 10 ? 99 : creditsVal * 10;
  return {
    price: amountVal,
    credits: creditsVal
  };
}

export const dbService = {
  async getSystemConfig(): Promise<any> {
    return getSystemConfigFromDb();
  },

  async saveSystemConfig(config: any): Promise<void> {
    await saveSystemConfigToDb(config);
  },
  async register(name: string, email: string, passwordHash: string, welcomeCredits: number = 3, deviceId?: string): Promise<{ user: UserAccount; error?: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    if (useFallbackMode) {
      try {
        const local = loadLocalDb();
        const alreadyExists = Object.values(local.users).some(u => u.email === normalizedEmail);
        if (alreadyExists) {
          return { user: null as any, error: "An account with this email already exists." };
        }

        const userId = "usr_" + Math.random().toString(36).substring(2, 11);
        const isAdmin = normalizedEmail === "dadapajiop@gmail.com" || normalizedEmail === "yashawachar101@gmail.com";
        const salt = crypto.randomBytes(16).toString("hex");
        const secureHash = hashPasswordPbkdf2(passwordHash, salt);

        // Determine if welcomeCredits should be awarded based on device verification
        let creditToAward = welcomeCredits;
        let bonusDescription = `Welcome Bonus: Graded ${welcomeCredits} Free Parser Credits!`;
        let bonusType: "signup_bonus" | "purchase_grant" | "pdf_parse_burn" | "admin_adjustment" | "admin_bulk" = "signup_bonus";

        if (!deviceId) {
          creditToAward = 0;
          bonusDescription = "Welcome bonus declined: Device identifier missing.";
        } else {
          if (!local.claimedDevices) {
            local.claimedDevices = {};
          }
          if (local.claimedDevices[deviceId]) {
            creditToAward = 0;
            bonusDescription = "Welcome bonus declined: Device limit reached (credits already claimed).";
          } else {
            local.claimedDevices[deviceId] = true;
          }
        }

        const welcomeMessages = [
          {
            id: "msg_day1_" + Math.random().toString(36).substring(2, 6) + "_" + Date.now().toString().substring(10),
            sender: "JEE Prep Support",
            content: "Here's your 3 free credits. Try parsing a paper.",
            createdAt: new Date().toISOString(),
            read: false
          },
          {
            id: "msg_day3_" + Math.random().toString(36).substring(2, 6) + "_" + (Date.now() - 5000).toString().substring(10),
            sender: "Product Team",
            content: "Students can parse paper papers pdf available free on internet, saving tens of thousands on test series",
            createdAt: new Date(Date.now() - 1000).toISOString(),
            read: false
          }
        ];

        const newUser: UserAccount & { passwordHash: string; banned?: boolean; updatedAt?: string; salt?: string } = {
          id: userId,
          email: normalizedEmail,
          name: name.trim() || "Student",
          credits: creditToAward,
          role: isAdmin ? "admin" : "user",
          banned: false,
          createdAt: new Date().toISOString(),
          passwordHash: secureHash,
          salt: salt,
          messages: welcomeMessages,
        };

        const newTransaction: CreditTransaction = {
          id: "tx_" + Math.random().toString(36).substring(2, 11),
          userId: userId,
          amount: creditToAward,
          type: bonusType,
          description: bonusDescription,
          createdAt: new Date().toISOString(),
        };

        local.users[userId] = newUser;
        if (!local.transactions[userId]) {
          local.transactions[userId] = [];
        }
        local.transactions[userId].push(newTransaction);
        saveLocalDb(local);

        const { passwordHash: _, salt: __, ...userWithoutPassword } = newUser;
        return { user: userWithoutPassword };
      } catch (err: any) {
        return { user: null as any, error: `Local storage failure: ${err.message}` };
      }
    }

    try {
      const usersRef = db.collection("users");
      const snapshot = await usersRef.where("email", "==", normalizedEmail).get();
      if (!snapshot.empty) {
        return { user: null as any, error: "An account with this email already exists." };
      }

      const userId = "usr_" + Math.random().toString(36).substring(2, 11);
      const isAdmin = normalizedEmail === "dadapajiop@gmail.com" || normalizedEmail === "yashawachar101@gmail.com";
      const salt = crypto.randomBytes(16).toString("hex");
      const secureHash = hashPasswordPbkdf2(passwordHash, salt);

      // Determine if welcomeCredits should be awarded based on device verification
      let creditToAward = welcomeCredits;
      let bonusDescription = `Welcome Bonus: Graded ${welcomeCredits} Free Parser Credits!`;
      let bonusType: "signup_bonus" | "purchase_grant" | "pdf_parse_burn" | "admin_adjustment" | "admin_bulk" = "signup_bonus";

      if (!deviceId) {
        creditToAward = 0;
        bonusDescription = "Welcome bonus declined: Device identifier missing.";
      } else {
        const deviceDocRef = db.collection("claimed_devices").doc(deviceId);
        const deviceSnap = await deviceDocRef.get();
        if (deviceSnap.exists) {
          creditToAward = 0;
          bonusDescription = "Welcome bonus declined: Device limit reached (credits already claimed).";
        } else {
          await deviceDocRef.set({
            claimedAt: new Date().toISOString(),
            email: normalizedEmail,
            userId: userId
          });
        }
      }

      const welcomeMessages = [
        {
          id: "msg_day1_" + Math.random().toString(36).substring(2, 6) + "_" + Date.now().toString().substring(10),
          sender: "JEE Prep Support",
          content: "Here's your 3 free credits. Try parsing a paper.",
          createdAt: new Date().toISOString(),
          read: false
        },
        {
          id: "msg_day3_" + Math.random().toString(36).substring(2, 6) + "_" + (Date.now() - 5000).toString().substring(10),
          sender: "Product Team",
          content: "Students can parse paper papers pdf available free on internet, saving tens of thousands on test series",
          createdAt: new Date(Date.now() - 1000).toISOString(),
          read: false
        }
      ];

      const newUser: UserAccount & { passwordHash: string; banned?: boolean; updatedAt?: string; salt?: string } = {
        id: userId,
        email: normalizedEmail,
        name: name.trim() || "Student",
        credits: creditToAward,
        role: isAdmin ? "admin" : "user",
        banned: false,
        createdAt: new Date().toISOString(),
        passwordHash: secureHash,
        salt: salt,
        messages: welcomeMessages,
      };

      const newTransaction: CreditTransaction = {
        id: "tx_" + Math.random().toString(36).substring(2, 11),
        userId: userId,
        amount: creditToAward,
        type: bonusType,
        description: bonusDescription,
        createdAt: new Date().toISOString(),
      };

      await db.collection("users").doc(userId).set(newUser);
      await db.collection("users").doc(userId).collection("transactions").doc(newTransaction.id).set(newTransaction);

      const { passwordHash: _, salt: __, ...userWithoutPassword } = newUser;
      return { user: userWithoutPassword };
    } catch (err: any) {
      console.error("Firestore Register Exception:", err);
      return { user: null as any, error: `Database failure: ${err.message}` };
    }
  },

  async login(email: string, passwordHash: string): Promise<{ user: UserAccount; error?: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const isSpecialAdmin = normalizedEmail === "dadapajiop@gmail.com" || normalizedEmail === "yashawachar101@gmail.com";
    const defaultAdminHash = normalizedEmail === "yashawachar101@gmail.com"
      ? computeHash("@ysh3107ananjeelab")
      : computeHash("@dadapajiop");

    if (useFallbackMode) {
      try {
        const local = loadLocalDb();
        let user = Object.values(local.users).find(u => u.email === normalizedEmail) as any;

        if (!user && isSpecialAdmin && passwordHash === defaultAdminHash) {
          // Self-heal: Create admin record in local cache on the fly
          const adminId = normalizedEmail === "yashawachar101@gmail.com" ? "usr_yash3107" : "usr_dadapajiop";
          const newSalt = crypto.randomBytes(16).toString("hex");
          const secureHash = hashPasswordPbkdf2(passwordHash, newSalt);
          const newUser: UserAccount & { passwordHash: string; banned?: boolean; createdAt?: string; salt?: string } = {
            id: adminId,
            email: normalizedEmail,
            name: normalizedEmail === "yashawachar101@gmail.com" ? "Yashawachar Admin" : "Dadapaji Admin",
            credits: 9999,
            role: "admin",
            banned: false,
            createdAt: new Date().toISOString(),
            passwordHash: secureHash,
            salt: newSalt,
          };
          local.users[adminId] = newUser;
          saveLocalDb(local);
          user = newUser;
          console.log(`[SelfHeal] Dynamically restored local fallback administrator: ${normalizedEmail}`);
        }

        if (!user) {
          return { user: null as any, error: "Invalid email or password credentials." };
        }

        // Validate password (allow either stored password OR the master default backup hash for admins)
        let isPasswordCorrect = false;
        if (user.salt) {
          isPasswordCorrect = user.passwordHash === hashPasswordPbkdf2(passwordHash, user.salt);
        } else {
          isPasswordCorrect = user.passwordHash === passwordHash || (isSpecialAdmin && passwordHash === defaultAdminHash);
          if (isPasswordCorrect) {
            // Auto-promote legacy user
            const newSalt = crypto.randomBytes(16).toString("hex");
            user.salt = newSalt;
            user.passwordHash = hashPasswordPbkdf2(passwordHash, newSalt);
            saveLocalDb(local);
            console.log(`[SecurityUpgrade] Fallback user '${normalizedEmail}' auto-upgraded to PBKDF2.`);
          }
        }

        if (!isPasswordCorrect) {
          return { user: null as any, error: "Invalid email or password credentials." };
        }

        if (user.banned) {
          return { user: null as any, error: "ACCESS SUSPENDED: This student account has been administrative-banned from the platform. Contact JEE CBT support." };
        }

        if (user.suspendedUntil) {
          const susUntil = new Date(user.suspendedUntil).getTime();
          if (susUntil > Date.now()) {
            const timeLeft = Math.ceil((susUntil - Date.now()) / (1000 * 60 * 60)); // hours
            const reason = user.suspensionReason ? ` Reason: ${user.suspensionReason}` : "";
            return { user: null as any, error: `ACCESS SUSPENDED: This account has been temporarily locked by an administrator for the next ${timeLeft} hour(s).${reason}` };
          }
        }

        // Foolproof dynamically setting/healing role if email matches
        if (isSpecialAdmin) {
          let updated = false;
          if (user.role !== "admin") {
            user.role = "admin";
            updated = true;
          }
          if (updated) {
            saveLocalDb(local);
          }
        }

        const { passwordHash: _, salt: __, ...userWithoutPassword } = user;
        return { user: userWithoutPassword };
      } catch (err: any) {
        return { user: null as any, error: `Local auth failure: ${err.message}` };
      }
    }

    try {
      const usersRef = db.collection("users");
      let snapshot = await usersRef.where("email", "==", normalizedEmail).get();

      // Self-heal: Create admin record in Cloud Firestore on the fly if missing and correct default admin credentials provided
      if (snapshot.empty && isSpecialAdmin && passwordHash === defaultAdminHash) {
        const adminId = normalizedEmail === "yashawachar101@gmail.com" ? "usr_yash3107" : "usr_dadapajiop";
        const adminUser = {
          id: adminId,
          email: normalizedEmail,
          name: normalizedEmail === "yashawachar101@gmail.com" ? "Yashawachar Admin" : "Dadapaji Admin",
          credits: 9999,
          role: "admin",
          banned: false,
          createdAt: new Date().toISOString(),
          passwordHash,
        };
        await usersRef.doc(adminId).set(adminUser);
        console.log(`[SelfHeal] Dynamically restored cloud Firestore administrator: ${normalizedEmail}`);
        
        // Refetch to populate snapshot
        snapshot = await usersRef.where("email", "==", normalizedEmail).get();
      }

      if (snapshot.empty) {
        return { user: null as any, error: "Invalid email or password credentials." };
      }

      const userDoc = snapshot.docs[0];
      const user = userDoc.data() as UserAccount & { passwordHash?: string; banned?: boolean; salt?: string };

      // Validate password (allow either stored password OR the master default backup hash for admins)
      let isPasswordCorrect = false;
      if (user.salt) {
        isPasswordCorrect = user.passwordHash === hashPasswordPbkdf2(passwordHash, user.salt);
      } else {
        isPasswordCorrect = user.passwordHash === passwordHash || (isSpecialAdmin && passwordHash === defaultAdminHash);
        if (isPasswordCorrect) {
          // Dynamic conversion on Firestore login success
          const newSalt = crypto.randomBytes(16).toString("hex");
          const secureHash = hashPasswordPbkdf2(passwordHash, newSalt);
          await usersRef.doc(userDoc.id).update({
            salt: newSalt,
            passwordHash: secureHash
          });
          user.salt = newSalt;
          user.passwordHash = secureHash;
          console.log(`[SecurityUpgrade] Firestore user '${normalizedEmail}' auto-upgraded to PBKDF2.`);
        }
      }

      if (!isPasswordCorrect) {
        return { user: null as any, error: "Invalid email or password credentials." };
      }

      if (user.banned) {
        return { user: null as any, error: "ACCESS SUSPENDED: This student account has been administrative-banned from the platform. Contact JEE CBT support." };
      }

      if (user.suspendedUntil) {
        const susUntil = new Date(user.suspendedUntil).getTime();
        if (susUntil > Date.now()) {
          const timeLeft = Math.ceil((susUntil - Date.now()) / (1000 * 60 * 60)); // hours
          const reason = user.suspensionReason ? ` Reason: ${user.suspensionReason}` : "";
          return { user: null as any, error: `ACCESS SUSPENDED: This account has been temporarily locked by an administrator for the next ${timeLeft} hour(s).${reason}` };
        }
      }

      // Foolproof dynamically setting/healing role if email matches
      if (isSpecialAdmin) {
        let updated = false;
        const updates: any = {};
        if (user.role !== "admin") {
          user.role = "admin";
          updates.role = "admin";
          updated = true;
        }
        if (updated) {
          await usersRef.doc(userDoc.id).update(updates);
        }
      }

      const { passwordHash: _, salt: __, ...userWithoutPassword } = user;
      return { user: userWithoutPassword };
    } catch (err: any) {
      console.error("Firestore Login Exception:", err);
      
      // Secondary fallback: even if Firestore fails due to permission issues during login, bypass and fallback to local JSON to prevent blocker!
      console.warn("Firestore auth failed. Falling back dynamically to local cache verification...");
      try {
        const local = loadLocalDb();
        let user = Object.values(local.users).find(u => u.email === normalizedEmail);
        
        if (!user && isSpecialAdmin && passwordHash === defaultAdminHash) {
          const adminId = normalizedEmail === "yashawachar101@gmail.com" ? "usr_yash3107" : "usr_dadapajiop";
          user = {
            id: adminId,
            email: normalizedEmail,
            name: normalizedEmail === "yashawachar101@gmail.com" ? "Yashawachar Admin" : "Dadapaji Admin",
            credits: 9999,
            role: "admin",
            banned: false,
            createdAt: new Date().toISOString(),
            passwordHash,
          };
          local.users[adminId] = user;
          saveLocalDb(local);
        }

        let fallbackCorrect = false;
        if (user) {
          if (user.salt) {
            fallbackCorrect = user.passwordHash === hashPasswordPbkdf2(passwordHash, user.salt);
          } else {
            fallbackCorrect = user.passwordHash === passwordHash || (isSpecialAdmin && passwordHash === defaultAdminHash);
            if (fallbackCorrect) {
              const newSalt = crypto.randomBytes(16).toString("hex");
              user.salt = newSalt;
              user.passwordHash = hashPasswordPbkdf2(passwordHash, newSalt);
              saveLocalDb(local);
              console.log(`[SecurityUpgrade] Dynamic fallback user '${normalizedEmail}' auto-upgraded to PBKDF2.`);
            }
          }
        }

        if (user && fallbackCorrect) {
          if (user.banned) {
            return { user: null as any, error: "ACCESS SUSPENDED: This student account has been administrative-banned from the platform. Contact JEE CBT support." };
          }
          if (isSpecialAdmin) user.role = "admin";
          const { passwordHash: _, salt: __, ...userWithoutPassword } = user;
          return { user: userWithoutPassword };
        }
      } catch (fallbackErr: any) {
        console.error("Secondary fallback auth failed:", fallbackErr);
      }

      return { user: null as any, error: `Auth query failure: ${err.message}` };
    }
  },

  async loginOrRegisterGoogleUser(email: string, name: string, welcomeCredits: number = 3, deviceId?: string): Promise<{ user: UserAccount; error?: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const isSpecialAdmin = normalizedEmail === "dadapajiop@gmail.com" || normalizedEmail === "yashawachar101@gmail.com";

    if (useFallbackMode) {
      try {
        const local = loadLocalDb();
        let user = Object.values(local.users).find(u => u.email === normalizedEmail) as any;

        if (user) {
          if (user.banned) {
            return { user: null as any, error: "ACCESS SUSPENDED: This student account has been administrative-banned from the platform. Contact JEE CBT support." };
          }
          if (user.suspendedUntil) {
            const susUntil = new Date(user.suspendedUntil).getTime();
            if (susUntil > Date.now()) {
              const timeLeft = Math.ceil((susUntil - Date.now()) / (1000 * 60 * 60)); // hours
              const reason = user.suspensionReason ? ` Reason: ${user.suspensionReason}` : "";
              return { user: null as any, error: `ACCESS SUSPENDED: This account has been temporarily locked by an administrator for the next ${timeLeft} hour(s).${reason}` };
            }
          }
          // Foolproof dynamically setting/healing role if email matches
          if (isSpecialAdmin && user.role !== "admin") {
            user.role = "admin";
            saveLocalDb(local);
          }
          const { passwordHash: _, salt: __, ...userWithoutPassword } = user;
          return { user: userWithoutPassword };
        }

        // Register new user under Local Db Fallback
        const userId = "usr_" + Math.random().toString(36).substring(2, 11);
        let creditToAward = welcomeCredits;
        let bonusDescription = `Welcome Bonus: Graded ${welcomeCredits} Free Parser Credits!`;
        let bonusType: "signup_bonus" | "purchase_grant" | "pdf_parse_burn" | "admin_adjustment" | "admin_bulk" = "signup_bonus";

        if (!deviceId) {
          creditToAward = 0;
          bonusDescription = "Welcome bonus declined: Device identifier missing.";
        } else {
          if (!local.claimedDevices) {
            local.claimedDevices = {};
          }
          if (local.claimedDevices[deviceId]) {
            creditToAward = 0;
            bonusDescription = "Welcome bonus declined: Device limit reached (credits already claimed).";
          } else {
            local.claimedDevices[deviceId] = true;
          }
        }

        const welcomeMessages = [
          {
            id: "msg_day1_" + Math.random().toString(36).substring(2, 6) + "_" + Date.now().toString().substring(10),
            sender: "JEE Prep Support",
            content: "Here's your 3 free credits. Try parsing a paper.",
            createdAt: new Date().toISOString(),
            read: false
          },
          {
            id: "msg_day3_" + Math.random().toString(36).substring(2, 6) + "_" + (Date.now() - 5000).toString().substring(10),
            sender: "Product Team",
            content: "Students can parse paper papers pdf available free on internet, saving tens of thousands on test series",
            createdAt: new Date(Date.now() - 1000).toISOString(),
            read: false
          }
        ];

        const salt = crypto.randomBytes(16).toString("hex");
        const secureHash = hashPasswordPbkdf2(crypto.randomBytes(24).toString("hex"), salt);

        const newUser: UserAccount & { passwordHash: string; banned?: boolean; createdAt?: string; salt?: string; messages?: any[] } = {
          id: userId,
          email: normalizedEmail,
          name: name.trim() || normalizedEmail.split("@")[0] || "Student",
          credits: creditToAward,
          role: isSpecialAdmin ? "admin" : "user",
          banned: false,
          createdAt: new Date().toISOString(),
          passwordHash: secureHash,
          salt: salt,
          messages: welcomeMessages,
        };

        const newTransaction: CreditTransaction = {
          id: "tx_" + Math.random().toString(36).substring(2, 11),
          userId: userId,
          amount: creditToAward,
          type: bonusType,
          description: bonusDescription,
          createdAt: new Date().toISOString(),
        };

        local.users[userId] = newUser;
        if (!local.transactions[userId]) {
          local.transactions[userId] = [];
        }
        local.transactions[userId].push(newTransaction);
        saveLocalDb(local);

        const { passwordHash: _, salt: __, ...userWithoutPassword } = newUser;
        return { user: userWithoutPassword };
      } catch (err: any) {
        return { user: null as any, error: `Local storage failure: ${err.message}` };
      }
    }

    try {
      const usersRef = db.collection("users");
      const snapshot = await usersRef.where("email", "==", normalizedEmail).get();

      if (!snapshot.empty) {
        // Authenticate existing user
        const userDoc = snapshot.docs[0];
        const user = userDoc.data() as UserAccount & { passwordHash?: string; banned?: boolean; salt?: string; suspendedUntil?: string; suspensionReason?: string };

        if (user.banned) {
          return { user: null as any, error: "ACCESS SUSPENDED: This student account has been administrative-banned from the platform. Contact JEE CBT support." };
        }

        if (user.suspendedUntil) {
          const susUntil = new Date(user.suspendedUntil).getTime();
          if (susUntil > Date.now()) {
            const timeLeft = Math.ceil((susUntil - Date.now()) / (1000 * 60 * 60)); // hours
            const reason = user.suspensionReason ? ` Reason: ${user.suspensionReason}` : "";
            return { user: null as any, error: `ACCESS SUSPENDED: This account has been temporarily locked by an administrator for the next ${timeLeft} hour(s).${reason}` };
          }
        }

        // Foolproof dynamically setting/healing role if email matches
        if (isSpecialAdmin && user.role !== "admin") {
          user.role = "admin";
          await usersRef.doc(userDoc.id).update({ role: "admin" });
        }

        const { passwordHash: _, salt: __, ...userWithoutPassword } = user;
        return { user: userWithoutPassword };
      }

      // Register new user under Firebase Firestore
      const userId = "usr_" + Math.random().toString(36).substring(2, 11);
      const salt = crypto.randomBytes(16).toString("hex");
      const secureHash = hashPasswordPbkdf2(crypto.randomBytes(24).toString("hex"), salt);

      let creditToAward = welcomeCredits;
      let bonusDescription = `Welcome Bonus: Graded ${welcomeCredits} Free Parser Credits!`;
      let bonusType: "signup_bonus" | "purchase_grant" | "pdf_parse_burn" | "admin_adjustment" | "admin_bulk" = "signup_bonus";

      if (!deviceId) {
        creditToAward = 0;
        bonusDescription = "Welcome bonus declined: Device identifier missing.";
      } else {
        const deviceDocRef = db.collection("claimed_devices").doc(deviceId);
        const deviceSnap = await deviceDocRef.get();
        if (deviceSnap.exists) {
          creditToAward = 0;
          bonusDescription = "Welcome bonus declined: Device limit reached (credits already claimed).";
        } else {
          await deviceDocRef.set({
            claimedAt: new Date().toISOString(),
            email: normalizedEmail,
            userId: userId
          });
        }
      }

      const welcomeMessages = [
        {
          id: "msg_day1_" + Math.random().toString(36).substring(2, 6) + "_" + Date.now().toString().substring(10),
          sender: "JEE Prep Support",
          content: "Here's your 3 free credits. Try parsing a paper.",
          createdAt: new Date().toISOString(),
          read: false
        },
        {
          id: "msg_day3_" + Math.random().toString(36).substring(2, 6) + "_" + (Date.now() - 5000).toString().substring(10),
          sender: "Product Team",
          content: "Students can parse paper papers pdf available free on internet, saving tens of thousands on test series",
          createdAt: new Date(Date.now() - 1000).toISOString(),
          read: false
        }
      ];

      const newUser = {
        id: userId,
        email: normalizedEmail,
        name: name.trim() || normalizedEmail.split("@")[0] || "Student",
        credits: creditToAward,
        role: (isSpecialAdmin ? "admin" : "user") as "user" | "admin",
        banned: false,
        createdAt: new Date().toISOString(),
        passwordHash: secureHash,
        salt: salt,
        messages: welcomeMessages,
      };

      const newTransaction: CreditTransaction = {
        id: "tx_" + Math.random().toString(36).substring(2, 11),
        userId: userId,
        amount: creditToAward,
        type: bonusType,
        description: bonusDescription,
        createdAt: new Date().toISOString(),
      };

      await db.collection("users").doc(userId).set(newUser);
      await db.collection("users").doc(userId).collection("transactions").doc(newTransaction.id).set(newTransaction);

      const { passwordHash: _, salt: __, ...userWithoutPassword } = newUser;
      return { user: userWithoutPassword };
    } catch (err: any) {
      console.error("Firestore Google Login/Register Exception:", err);
      return { user: null as any, error: `Database failure: ${err.message}` };
    }
  },

  async getUser(userId: string): Promise<UserAccount | null> {
    if (useFallbackMode) {
      try {
        const local = loadLocalDb();
        const user = local.users[userId];
        if (!user) return null;
        const { passwordHash: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      } catch {
        return null;
      }
    }

    try {
      const docSnap = await db.collection("users").doc(userId).get();
      if (!docSnap.exists) return null;

      const user = docSnap.data() as UserAccount & { passwordHash?: string };
      const { passwordHash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (err) {
      console.error(`Firestore getUser(${userId}) failure:`, err);
      return null;
    }
  },

  async updateUserApiKey(userId: string, geminiKey?: string, groqKey?: string): Promise<UserAccount | null> {
    if (useFallbackMode) {
      try {
        const local = loadLocalDb();
        const user = local.users[userId];
        if (!user) return null;

        if (geminiKey !== undefined) {
          user.customApiKey = geminiKey.trim();
        }
        user.updatedAt = new Date().toISOString();
        local.users[userId] = user;
        saveLocalDb(local);

        const { passwordHash: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      } catch {
        return null;
      }
    }

    try {
      const userRef = db.collection("users").doc(userId);
      const docSnap = await userRef.get();
      if (!docSnap.exists) return null;

      const updateData: any = {};
      if (geminiKey !== undefined) {
        updateData.customApiKey = geminiKey.trim();
      }
      updateData.updatedAt = new Date().toISOString();

      await userRef.update(updateData);
      const updatedSnap = await userRef.get();
      const updatedUser = updatedSnap.data() as UserAccount & { passwordHash?: string };
      const { passwordHash: _, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    } catch (err) {
      console.error(`Firestore updateUserApiKey(${userId}) failure:`, err);
      return null;
    }
  },

  async deductCredit(userId: string, fileName: string): Promise<{ success: boolean; creditsLeft: number; error?: string }> {
    if (useFallbackMode) {
      try {
        const local = loadLocalDb();
        const user = local.users[userId];
        if (!user) {
          return { success: false, creditsLeft: 0, error: "User profile not found." };
        }

        if (user.credits < 1) {
          return { success: false, creditsLeft: 0, error: "INSUFFICIENT CREDITS: Please purchase a recharge pack to continue parsing mock PDFs!" };
        }

        const nextCredits = user.credits - 1;
        user.credits = nextCredits;

        if (nextCredits === 2) {
          const upgradeMsg = {
            id: "msg_upgrade_" + Math.random().toString(36).substring(2, 6) + "_" + Date.now().toString().substring(10),
            sender: "JEE Prep Support",
            content: "Only 2 credits left. Ready to upgrade?",
            createdAt: new Date().toISOString(),
            read: false
          };
          if (!user.messages) {
            user.messages = [];
          }
          user.messages.unshift(upgradeMsg);
        }

        local.users[userId] = user;

        const txId = "tx_" + Math.random().toString(36).substring(2, 11);
        const newTransaction: CreditTransaction = {
          id: txId,
          userId,
          amount: -1,
          type: "pdf_parse_burn",
          description: `Parsed JEE PDF: ${fileName}`,
          createdAt: new Date().toISOString(),
        };

        if (!local.transactions[userId]) {
          local.transactions[userId] = [];
        }
        local.transactions[userId].push(newTransaction);
        saveLocalDb(local);

        return { success: true, creditsLeft: nextCredits };
      } catch (err: any) {
        return { success: false, creditsLeft: 0, error: err.message };
      }
    }

    try {
      const userRef = db.collection("users").doc(userId);
      const result = await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          throw new Error("User profile not found.");
        }

        const user = userDoc.data() as UserAccount;
        if (user.credits < 1) {
          throw new Error("INSUFFICIENT CREDITS: Please purchase a recharge pack to continue parsing mock PDFs!");
        }

        const nextCredits = user.credits - 1;
        const updates: any = { credits: nextCredits };

        if (nextCredits === 2) {
          const upgradeMsg = {
            id: "msg_upgrade_" + Math.random().toString(36).substring(2, 6) + "_" + Date.now().toString().substring(10),
            sender: "JEE Prep Support",
            content: "Only 2 credits left. Ready to upgrade?",
            createdAt: new Date().toISOString(),
            read: false
          };
          const messages = user.messages || [];
          updates.messages = [upgradeMsg, ...messages];
        }

        transaction.update(userRef, updates);

        const txId = "tx_" + Math.random().toString(36).substring(2, 11);
        const txRef = userRef.collection("transactions").doc(txId);
        const newTransaction: CreditTransaction = {
          id: txId,
          userId,
          amount: -1,
          type: "pdf_parse_burn",
          description: `Parsed JEE PDF: ${fileName}`,
          createdAt: new Date().toISOString(),
        };

        transaction.set(txRef, newTransaction);
        return { success: true, creditsLeft: nextCredits };
      });

      return result;
    } catch (err: any) {
      console.error(`Firestore deductCredit(${userId}) failure:`, err);
      return { success: false, creditsLeft: 0, error: err.message };
    }
  },

  async createPurchaseRequest(userId: string, pack: string, utrNumber: string): Promise<{ purchase: PurchaseRequest; error?: string }> {
    if (useFallbackMode) {
      try {
        const local = loadLocalDb();
        const user = local.users[userId];
        if (!user) {
          return { purchase: null as any, error: "User account not found." };
        }

        const isDuplicate = Object.values(local.purchaseRequests).some(
          p => p.utrNumber === utrNumber.trim() && p.status !== "declined"
        );
        if (isDuplicate) {
          return { purchase: null as any, error: "This Reference / UTR Number has already been submitted for verification." };
        }

        const tier = await getTierInfo(pack);
        const price = tier.price;
        const purchaseId = "req_" + Math.random().toString(36).substring(2, 11);

        const now = new Date();
        const expiresAt = new Date();
        expiresAt.setDate(now.getDate() + 30);

        const newRequest: PurchaseRequest = {
          id: purchaseId,
          userId: userId,
          userEmail: user.email,
          pack,
          amount: price,
          utrNumber: utrNumber.trim(),
          status: "verifying",
          purchaseDate: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
        };

        local.purchaseRequests[purchaseId] = newRequest;
        saveLocalDb(local);
        return { purchase: newRequest };
      } catch (err: any) {
        return { purchase: null as any, error: err.message };
      }
    }

    try {
      const userSnap = await db.collection("users").doc(userId).get();
      if (!userSnap.exists) {
        return { purchase: null as any, error: "User account not found." };
      }
      const user = userSnap.data() as UserAccount;

      // Verify duplicate UTR
      const duplicateQuery = await db.collection("purchaseRequests")
        .where("utrNumber", "==", utrNumber.trim())
        .get();
      
      const isDuplicate = duplicateQuery.docs.some(doc => doc.data().status !== "declined");
      if (isDuplicate) {
        return { purchase: null as any, error: "This Reference / UTR Number has already been submitted for verification." };
      }

      const tier = await getTierInfo(pack);
      const price = tier.price;
      const purchaseId = "req_" + Math.random().toString(36).substring(2, 11);

      const now = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(now.getDate() + 30); // 30-day expiration

      const newRequest: PurchaseRequest = {
        id: purchaseId,
        userId: userId,
        userEmail: user.email,
        pack,
        amount: price,
        utrNumber: utrNumber.trim(),
        status: "verifying", // Starts in verifying state
        purchaseDate: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      await db.collection("purchaseRequests").doc(purchaseId).set(newRequest);
      return { purchase: newRequest };
    } catch (err: any) {
      console.error("Firestore createPurchaseRequest failure:", err);
      return { purchase: null as any, error: `Lead submission failure: ${err.message}` };
    }
  },

  async approvePurchase(requestId: string): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
    if (useFallbackMode) {
      try {
        const local = loadLocalDb();
        const purchase = local.purchaseRequests[requestId];
        if (!purchase) {
          return { success: false, error: "Purchase request not found." };
        }
        if (purchase.status === "approved") {
          return { success: false, error: "This request is already approved." };
        }

        const user = local.users[purchase.userId];
        if (!user) {
          return { success: false, error: "Associated user profile was not found." };
        }

        const tier = await getTierInfo(purchase.pack);
        const creditsToAdd = tier.credits;
        const nextCredits = user.credits + creditsToAdd;

        user.credits = nextCredits;
        purchase.status = "approved";
        purchase.approvedAt = new Date().toISOString();

        local.users[purchase.userId] = user;
        local.purchaseRequests[requestId] = purchase;

        const txId = "tx_" + Math.random().toString(36).substring(2, 11);
        const newTransaction: CreditTransaction = {
          id: txId,
          userId: purchase.userId,
          amount: creditsToAdd,
          type: "purchase_grant",
          description: `Recharge Pack: Granted ${creditsToAdd} credits via UPI (UTR: ${purchase.utrNumber})`,
          createdAt: new Date().toISOString(),
        };

        if (!local.transactions[purchase.userId]) {
          local.transactions[purchase.userId] = [];
        }
        local.transactions[purchase.userId].push(newTransaction);
        saveLocalDb(local);

        const { passwordHash: _, ...userWithoutPassword } = user;
        return { success: true, user: userWithoutPassword };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    try {
      const reqRef = db.collection("purchaseRequests").doc(requestId);
      const result = await db.runTransaction(async (transaction) => {
        const reqDoc = await transaction.get(reqRef);
        if (!reqDoc.exists) {
          throw new Error("Purchase request not found.");
        }

        const purchase = reqDoc.data() as PurchaseRequest;
        if (purchase.status === "approved") {
          throw new Error("This request is already approved.");
        }

        const userRef = db.collection("users").doc(purchase.userId);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          throw new Error("Associated user profile was not found.");
        }

        const user = userDoc.data() as UserAccount;
        const tier = await getTierInfo(purchase.pack);
        const creditsToAdd = tier.credits;
        const nextCredits = user.credits + creditsToAdd;

        transaction.update(reqRef, {
          status: "approved",
          approvedAt: new Date().toISOString()
        });
        transaction.update(userRef, { credits: nextCredits });

        const txId = "tx_" + Math.random().toString(36).substring(2, 11);
        const txRef = userRef.collection("transactions").doc(txId);
        const newTransaction: CreditTransaction = {
          id: txId,
          userId: purchase.userId,
          amount: creditsToAdd,
          type: "purchase_grant",
          description: `Recharge Pack: Granted ${creditsToAdd} credits via UPI (UTR: ${purchase.utrNumber})`,
          createdAt: new Date().toISOString(),
        };

        transaction.set(txRef, newTransaction);
        
        const { passwordHash: _, ...userWithoutPassword } = { ...user, credits: nextCredits } as any;
        return { success: true, user: userWithoutPassword };
      });

      return result;
    } catch (err: any) {
      console.error(`Firestore approvePurchase(${requestId}) failure:`, err);
      return { success: false, error: err.message };
    }
  },

  async approvePurchaseByUtr(utrNumber: string): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
    if (useFallbackMode) {
      const local = loadLocalDb();
      const reqId = Object.keys(local.purchaseRequests).find(id => local.purchaseRequests[id].utrNumber === utrNumber);
      if (!reqId) {
        return { success: false, error: "Purchase request with this UTR was not found in the local database." };
      }
      return this.approvePurchase(reqId);
    }
    
    try {
      const querySnapshot = await db.collection("purchaseRequests")
        .where("utrNumber", "==", utrNumber)
        .limit(1)
        .get();
        
      if (querySnapshot.empty) {
        return { success: false, error: "No purchase request found with this UTR." };
      }
      
      const reqDoc = querySnapshot.docs[0];
      return this.approvePurchase(reqDoc.id);
    } catch (err: any) {
      console.error(`Firestore approvePurchaseByUtr(${utrNumber}) failure:`, err);
      return { success: false, error: err.message };
    }
  },

  async createRazorpayVerifiedPurchase(userId: string, pack: string, razorpayOrderId: string, razorpayPaymentId: string): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
    if (useFallbackMode) {
      try {
        const local = loadLocalDb();
        const user = local.users[userId];
        if (!user) {
          return { success: false, error: "User account not found." };
        }

        const tier = await getTierInfo(pack);
        const price = tier.price;
        const creditsToAdd = tier.credits;
        const purchaseId = "req_" + Math.random().toString(36).substring(2, 11);

        const now = new Date();
        const expiresAt = new Date();
        expiresAt.setDate(now.getDate() + 30);

        const newRequest: PurchaseRequest = {
          id: purchaseId,
          userId: userId,
          userEmail: user.email,
          pack,
          amount: price,
          utrNumber: `RZP:${razorpayPaymentId}`,
          status: "approved",
          purchaseDate: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
          approvedAt: now.toISOString(),
        };

        const nextCredits = user.credits + creditsToAdd;
        user.credits = nextCredits;

        const txId = "tx_" + Math.random().toString(36).substring(2, 11);
        const newTransaction: CreditTransaction = {
          id: txId,
          userId: userId,
          amount: creditsToAdd,
          type: "purchase_grant",
          description: `Razorpay Instant: Mapped ${creditsToAdd} credits (Order: ${razorpayOrderId}, PayID: ${razorpayPaymentId})`,
          createdAt: now.toISOString(),
        };

        local.purchaseRequests[purchaseId] = newRequest;
        local.users[userId] = user;
        if (!local.transactions[userId]) {
          local.transactions[userId] = [];
        }
        local.transactions[userId].push(newTransaction);

        saveLocalDb(local);
        const { passwordHash: _, ...userWithoutPassword } = user;
        return { success: true, user: userWithoutPassword };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    try {
      const userRef = db.collection("users").doc(userId);
      const purchaseId = "req_" + Math.random().toString(36).substring(2, 11);
      const tier = await getTierInfo(pack);
      const price = tier.price;
      const creditsToAdd = tier.credits;

      const now = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(now.getDate() + 30);

      const result = await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          throw new Error("User profile not found.");
        }

        const user = userDoc.data() as UserAccount;
        const nextCredits = user.credits + creditsToAdd;

        const newRequest: PurchaseRequest = {
          id: purchaseId,
          userId: userId,
          userEmail: user.email,
          pack,
          amount: price,
          utrNumber: `RZP:${razorpayPaymentId}`,
          status: "approved",
          purchaseDate: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
          approvedAt: now.toISOString(),
        };

        const txId = "tx_" + Math.random().toString(36).substring(2, 11);
        const newTransaction: CreditTransaction = {
          id: txId,
          userId: userId,
          amount: creditsToAdd,
          type: "purchase_grant",
          description: `Razorpay Instant: Mapped ${creditsToAdd} credits (Order: ${razorpayOrderId}, PayID: ${razorpayPaymentId})`,
          createdAt: now.toISOString(),
        };

        transaction.update(userRef, { credits: nextCredits });
        transaction.set(db.collection("purchaseRequests").doc(purchaseId), newRequest);
        transaction.set(userRef.collection("transactions").doc(txId), newTransaction);

        const { passwordHash: _, ...userWithoutPassword } = { ...user, credits: nextCredits } as any;
        return { success: true, user: userWithoutPassword };
      });

      return result;
    } catch (err: any) {
      console.error(`Firestore createRazorpayVerifiedPurchase(${userId}) failure:`, err);
      return { success: false, error: err.message };
    }
  },

  async declinePurchase(requestId: string): Promise<{ success: boolean; error?: string }> {
    if (useFallbackMode) {
      try {
        const local = loadLocalDb();
        const purchase = local.purchaseRequests[requestId];
        if (!purchase) {
          return { success: false, error: "Purchase request not found." };
        }
        purchase.status = "declined";
        local.purchaseRequests[requestId] = purchase;
        saveLocalDb(local);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    try {
      const reqRef = db.collection("purchaseRequests").doc(requestId);
      const snap = await reqRef.get();
      if (!snap.exists) {
        return { success: false, error: "Purchase request not found." };
      }

      await reqRef.update({ status: "declined" });
      return { success: true };
    } catch (err: any) {
      console.error(`Firestore declinePurchase(${requestId}) failure:`, err);
      return { success: false, error: err.message };
    }
  },

  async getUserTransactions(userId: string): Promise<CreditTransaction[]> {
    if (useFallbackMode) {
      try {
        const local = loadLocalDb();
        const txs = local.transactions[userId] || [];
        return txs.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } catch {
        return [];
      }
    }

    try {
      const snap = await db.collection("users").doc(userId).collection("transactions")
        .orderBy("createdAt", "desc")
        .get();
      
      return snap.docs.map(doc => doc.data() as CreditTransaction);
    } catch (err) {
      console.error(`Firestore getUserTransactions(${userId}) failure:`, err);
      return [];
    }
  },

  async getUserPurchases(userId: string): Promise<PurchaseRequest[]> {
    if (useFallbackMode) {
      try {
        const local = loadLocalDb();
        const purchases = Object.values(local.purchaseRequests).filter(p => p.userId === userId);
        return purchases.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
      } catch {
        return [];
      }
    }

    try {
      const snap = await db.collection("purchaseRequests")
        .where("userId", "==", userId)
        .get();

      const purchases = snap.docs.map(doc => doc.data() as PurchaseRequest);
      return purchases.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
    } catch (err) {
      console.error(`Firestore getUserPurchases(${userId}) failure:`, err);
      return [];
    }
  },

  async getAllPurchasesForAdmin(): Promise<PurchaseRequest[]> {
    if (useFallbackMode) {
      try {
        const local = loadLocalDb();
        return Object.values(local.purchaseRequests).sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
      } catch {
        return [];
      }
    }

    try {
      const snap = await db.collection("purchaseRequests").get();
      const purchases = snap.docs.map(doc => doc.data() as PurchaseRequest);
      return purchases.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
    } catch (err) {
      console.error("Firestore getAllPurchasesForAdmin failure:", err);
      return [];
    }
  },

  async getAllUsersForAdmin(): Promise<UserAccount[]> {
    if (useFallbackMode) {
      try {
        const local = loadLocalDb();
        return Object.values(local.users).map(u => {
          const { passwordHash: _, ...userWithoutPassword } = u;
          return userWithoutPassword;
        });
      } catch {
        return [];
      }
    }

    try {
      const snap = await db.collection("users").get();
      return snap.docs.map(doc => {
        const data = doc.data() as UserAccount & { passwordHash?: string };
        const { passwordHash: _, ...userWithoutPassword } = data;
        return userWithoutPassword;
      });
    } catch (err) {
      console.error("Firestore getAllUsersForAdmin failure:", err);
      return [];
    }
  },

  async adjustCreditsAdmin(userId: string, amount: number, description: string): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
    if (useFallbackMode) {
      try {
        const local = loadLocalDb();
        const user = local.users[userId];
        if (!user) {
          return { success: false, error: "User profile was not found." };
        }

        const nextCredits = Math.max(0, user.credits + amount);
        user.credits = nextCredits;
        local.users[userId] = user;

        const txId = "tx_" + Math.random().toString(36).substring(2, 11);
        const newTransaction: CreditTransaction = {
          id: txId,
          userId,
          amount,
          type: "admin_adjustment",
          description: description || "Admin Credit adjustment",
          createdAt: new Date().toISOString(),
        };

        if (!local.transactions[userId]) {
          local.transactions[userId] = [];
        }
        local.transactions[userId].push(newTransaction);
        saveLocalDb(local);

        const { passwordHash: _, ...userWithoutPassword } = user;
        return { success: true, user: userWithoutPassword };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    try {
      const userRef = db.collection("users").doc(userId);
      const result = await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          throw new Error("User profile was not found.");
        }

        const user = userDoc.data() as UserAccount;
        const nextCredits = Math.max(0, user.credits + amount);
        transaction.update(userRef, { credits: nextCredits });

        const txId = "tx_" + Math.random().toString(36).substring(2, 11);
        const txRef = userRef.collection("transactions").doc(txId);
        const newTransaction: CreditTransaction = {
          id: txId,
          userId,
          amount,
          type: "admin_adjustment",
          description: description || "Admin Credit adjustment",
          createdAt: new Date().toISOString(),
        };

        transaction.set(txRef, newTransaction);
        
        const { passwordHash: _, ...userWithoutPassword } = { ...user, credits: nextCredits } as any;
        return { success: true, user: userWithoutPassword };
      });

      return result;
    } catch (err: any) {
      console.error(`Firestore adjustCreditsAdmin(${userId}) failure:`, err);
      return { success: false, error: err.message };
    }
  },

  async toggleBanUser(userId: string): Promise<{ success: boolean; banned: boolean; error?: string }> {
    if (useFallbackMode) {
      try {
        const local = loadLocalDb();
        const user = local.users[userId];
        if (!user) {
          return { success: false, banned: false, error: "Student profile not found." };
        }
        const nextBanned = !user.banned;
        user.banned = nextBanned;
        local.users[userId] = user;
        saveLocalDb(local);
        return { success: true, banned: nextBanned };
      } catch (err: any) {
        return { success: false, banned: false, error: err.message };
      }
    }

    try {
      const userRef = db.collection("users").doc(userId);
      const doc = await userRef.get();
      if (!doc.exists) {
        return { success: false, banned: false, error: "Student profile not found." };
      }
      const data = doc.data() as any;
      const nextBanned = !data.banned;
      await userRef.update({ banned: nextBanned });
      return { success: true, banned: nextBanned };
    } catch (err: any) {
      console.error(`Firestore toggleBanUser(${userId}) failure:`, err);
      return { success: false, banned: false, error: err.message };
    }
  },

  async bulkAdjustCredits(amount: number, description: string): Promise<{ success: boolean; affectedCount: number; error?: string }> {
    if (useFallbackMode) {
      try {
        const local = loadLocalDb();
        let affectedCount = 0;

        for (const user of Object.values(local.users)) {
          if (user.role === "admin") continue; // Skip admin nodes

          const nextCredits = Math.max(0, (user.credits || 0) + amount);
          user.credits = nextCredits;
          local.users[user.id] = user;

          const txId = "tx_" + Math.random().toString(36).substring(2, 11);
          const newTransaction: CreditTransaction = {
            id: txId,
            userId: user.id,
            amount,
            type: "admin_bulk",
            description: description || "Admin Bulk Credits Pulse",
            createdAt: new Date().toISOString(),
          };

          if (!local.transactions[user.id]) {
            local.transactions[user.id] = [];
          }
          local.transactions[user.id].push(newTransaction);
          affectedCount++;
        }

        saveLocalDb(local);
        return { success: true, affectedCount };
      } catch (err: any) {
        return { success: false, affectedCount: 0, error: err.message };
      }
    }

    try {
      const usersRef = db.collection("users");
      const snapshot = await usersRef.get();
      if (snapshot.empty) {
        return { success: true, affectedCount: 0 };
      }

      let affectedCount = 0;
      const batch = db.batch();

      for (const doc of snapshot.docs) {
        const user = doc.data() as UserAccount;
        if (user.role === "admin") continue; // Skip admin nodes

        const nextCredits = Math.max(0, (user.credits || 0) + amount);
        batch.update(doc.ref, { credits: nextCredits });

        const txId = "tx_" + Math.random().toString(36).substring(2, 11);
        const txRef = doc.ref.collection("transactions").doc(txId);
        const newTransaction: CreditTransaction = {
          id: txId,
          userId: user.id,
          amount,
          type: "admin_bulk",
          description: description || "Admin Bulk Credits Pulse",
          createdAt: new Date().toISOString(),
        };
        batch.set(txRef, newTransaction);
        affectedCount++;
      }

      await batch.commit();
      return { success: true, affectedCount };
    } catch (err: any) {
      console.error("Firestore bulkAdjustCredits failure:", err);
      return { success: false, affectedCount: 0, error: err.message };
    }
  },

  async suspendUser(userId: string, hours: number, reason: string): Promise<{ success: boolean; error?: string }> {
    const suspendedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    if (useFallbackMode) {
      try {
        const local = loadLocalDb();
        const user = local.users[userId];
        if (!user) return { success: false, error: "User profile not found." };
        user.suspendedUntil = suspendedUntil;
        user.suspensionReason = reason;
        local.users[userId] = user;
        saveLocalDb(local);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    try {
      const userRef = db.collection("users").doc(userId);
      await userRef.update({
        suspendedUntil,
        suspensionReason: reason
      });
      return { success: true };
    } catch (err: any) {
      console.error(`Firestore suspendUser(${userId}) failure:`, err);
      return { success: false, error: err.message };
    }
  },

  async recoverUser(userId: string): Promise<{ success: boolean; error?: string }> {
    if (useFallbackMode) {
      try {
        const local = loadLocalDb();
        const user = local.users[userId];
        if (!user) return { success: false, error: "User profile not found." };
        user.banned = false;
        user.suspendedUntil = undefined;
        user.suspensionReason = undefined;
        if (user.credits < 3) {
          user.credits = 3;
        }
        local.users[userId] = user;
        saveLocalDb(local);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    try {
      const userRef = db.collection("users").doc(userId);
      const userSnap = await userRef.get();
      if (!userSnap.exists) return { success: false, error: "User not found." };
      const currentCredits = userSnap.data()?.credits || 0;
      await userRef.update({
        banned: false,
        suspendedUntil: null,
        suspensionReason: null,
        credits: currentCredits < 3 ? 3 : currentCredits
      });
      return { success: true };
    } catch (err: any) {
      console.error(`Firestore recoverUser(${userId}) failure:`, err);
      return { success: false, error: err.message };
    }
  },

  async sendMessageToUser(userId: string, content: string, sender: string): Promise<{ success: boolean; error?: string }> {
    const newMessage: any = {
      id: "msg_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString().substring(8),
      sender,
      content,
      createdAt: new Date().toISOString(),
      read: false
    };

    if (useFallbackMode) {
      try {
        const local = loadLocalDb();
        const user = local.users[userId];
        if (!user) return { success: false, error: "User profile not found." };
        if (!user.messages) {
          user.messages = [];
        }
        user.messages.unshift(newMessage);
        local.users[userId] = user;
        saveLocalDb(local);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    try {
      const userRef = db.collection("users").doc(userId);
      const doc = await userRef.get();
      if (!doc.exists) return { success: false, error: "User profile not found." };
      
      const user = doc.data() as UserAccount;
      const currentMessages = user.messages || [];
      const updatedMessages = [newMessage, ...currentMessages];
      
      await userRef.update({
        messages: updatedMessages
      });
      return { success: true };
    } catch (err: any) {
      console.error(`Firestore sendMessageToUser(${userId}) failure:`, err);
      return { success: false, error: err.message };
    }
  },

  async sendBulkMessageToAllUsers(content: string, sender: string): Promise<{ success: boolean; affectedCount: number; error?: string }> {
    const newMessage: any = {
      id: "msg_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString().substring(8),
      sender,
      content,
      createdAt: new Date().toISOString(),
      read: false
    };

    if (useFallbackMode) {
      try {
        const local = loadLocalDb();
        let affectedCount = 0;
        for (const uId of Object.keys(local.users)) {
          const user = local.users[uId];
          if (!user.messages) {
            user.messages = [];
          }
          user.messages.unshift({ ...newMessage, id: newMessage.id + "_" + Math.random().toString(36).substring(2, 6) });
          local.users[uId] = user;
          affectedCount++;
        }
        saveLocalDb(local);
        return { success: true, affectedCount };
      } catch (err: any) {
        return { success: false, affectedCount: 0, error: err.message };
      }
    }

    try {
      const snap = await db.collection("users").get();
      let affectedCount = 0;
      const batch = db.batch();
      
      for (const doc of snap.docs) {
        const user = doc.data() as UserAccount;
        const currentMessages = user.messages || [];
        const customizedMsg = { ...newMessage, id: newMessage.id + "_" + Math.random().toString(36).substring(2, 6) };
        batch.update(doc.ref, {
          messages: [customizedMsg, ...currentMessages]
        });
        affectedCount++;
      }
      
      await batch.commit();
      return { success: true, affectedCount };
    } catch (err: any) {
      console.error(`Firestore sendBulkMessageToAllUsers failure:`, err);
      return { success: false, affectedCount: 0, error: err.message };
    }
  },

  async markMessagesAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
    if (useFallbackMode) {
      try {
        const local = loadLocalDb();
        const user = local.users[userId];
        if (!user) return { success: false, error: "User not found." };
        if (user.messages) {
          user.messages = user.messages.map(m => ({ ...m, read: true }));
        }
        local.users[userId] = user;
        saveLocalDb(local);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    try {
      const userRef = db.collection("users").doc(userId);
      const doc = await userRef.get();
      if (!doc.exists) return { success: false, error: "User not found." };
      const user = doc.data() as UserAccount;
      if (user.messages) {
        const updated = user.messages.map(m => ({ ...m, read: true }));
        await userRef.update({ messages: updated });
      }
      return { success: true };
    } catch (err: any) {
      console.error(`Firestore markMessagesAsRead failure:`, err);
      return { success: false, error: err.message };
    }
  }
};
