import { initializeApp, getApps, getApp, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// 1. Prepare the Service Account Key
let serviceAccount: ServiceAccount;

console.log("---------------------------------------------------");
console.log("🔥 FIREBASE ADMIN INIT START");

// CHECK: Is the variable inside Vercel?
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  console.log("✅ FOUND Environment Variable: FIREBASE_SERVICE_ACCOUNT_KEY");
  
  try {
    // Try to parse it
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    console.log("✅ JSON Parse Successful. Project ID:", serviceAccount.projectId);
  } catch (error) {
    console.error("❌ CRITICAL ERROR: Could not parse JSON from Env Var.");
    console.error(error);
  }

} else {
  console.log("⚠️ Environment Variable NOT found.");
  console.log("   Checking for local file (Development Mode)...");
  
  try {
    serviceAccount = require("../../service-account.json");
    console.log("✅ Found local service-account.json");
  } catch (e) {
    console.error("❌ File NOT found. You are in Production but have no Env Var.");
  }
}

// 2. Safety Check
if (!serviceAccount) {
  console.error("❌ STOPPING BUILD: No Service Account Credential available.");
  throw new Error("Firebase Admin Init Failed: No Credentials");
}

// 3. Initialize Firebase Admin
export const adminApp = !getApps().length
  ? initializeApp({
      credential: cert(serviceAccount),
    })
  : getApp();

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);

console.log("🔥 FIREBASE ADMIN INIT COMPLETE");
console.log("---------------------------------------------------");