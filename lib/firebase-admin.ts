import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import path from "path";
import fs from "fs";

// 1. Define path to the file
const localKeyPath = path.join(process.cwd(), "service-account.json");
let serviceAccount;

// 2. Force Read from File
try {
  console.log("🔍 FIREBASE INIT: Looking for key at:", localKeyPath);
  
  if (fs.existsSync(localKeyPath)) {
    const fileContent = fs.readFileSync(localKeyPath, "utf8");
    serviceAccount = JSON.parse(fileContent);
    console.log("✅ FIREBASE INIT: Key loaded successfully for project:", serviceAccount.project_id);
  } else {
    console.error("❌ FIREBASE INIT: File NOT found at path.");
    // Only verify Env var if file is missing (Vercel fallback)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log("☁️ FIREBASE INIT: Attempting to use Env Variable...");
      const rawEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
      const jsonString = rawEnv.startsWith("{") 
        ? rawEnv 
        : Buffer.from(rawEnv, 'base64').toString('utf-8');
      serviceAccount = JSON.parse(jsonString);
    }
  }
} catch (error) {
  console.error("❌ FIREBASE INIT ERROR:", error);
}

// 3. Initialize Firebase (Singleton Pattern)
const app = getApps().length > 0 
  ? getApps()[0] 
  : initializeApp({
      credential: cert(serviceAccount),
    });

// 4. Export Auth and DB
export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);