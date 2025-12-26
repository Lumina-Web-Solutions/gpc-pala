const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");

console.log("1. Reading key file...");
console.log("   Project ID found:", serviceAccount.project_id);

try {
  console.log("2. Initializing Firebase...");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("   ✅ Success! The key is valid and working.");
} catch (error) {
  console.log("   ❌ ERROR: Firebase rejected the key.");
  console.log("   Reason:", error.code, "-", error.message);
}