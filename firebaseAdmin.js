// firebaseAdmin.js - Firebase Admin SDK ONLY (Server-Side)
const admin = require("firebase-admin");

// Prevent multiple initializations
if (!admin.apps.length) {
  try {
    let serviceAccount;
    
    // Try to load from environment variable first (Production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } 
    // Try to load from file (Development)
    else {
      try {
        serviceAccount = require("./serviceAccountKey.json");
      } catch (err) {
        console.error("❌ Firebase service account key not found!");
        console.error("💡 Create serviceAccountKey.json in project root");
        console.error("💡 Get it from: Firebase Console → Project Settings → Service Accounts");
        process.exit(1);
      }
    }
    
    // Initialize Firebase Admin SDK (SERVER-SIDE ONLY)
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log("✅ Firebase Admin initialized");
  } catch (error) {
    console.error("❌ Firebase init failed:", error.message);
    process.exit(1);
  }
}

module.exports = admin;