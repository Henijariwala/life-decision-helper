// firebaseAdmin.js - Firebase Admin SDK Initialization (Server-Side)
const admin = require("firebase-admin");

// Prevent multiple initializations
if (!admin.apps.length) {
  try {
    let credential;
    
    // Production: Use environment variable with JSON string
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      credential = admin.credential.cert(serviceAccount);
    } 
    // Development: Use file
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      credential = admin.credential.cert(serviceAccount);
    }
    // Default: Look for serviceAccountKey.json in root
    else {
      try {
        const serviceAccount = require("./serviceAccountKey.json");
        credential = admin.credential.cert(serviceAccount);
      } catch (err) {
        console.error("❌ Firebase service account key not found!");
        console.error("💡 Please add serviceAccountKey.json to project root");
        console.error("💡 Or set FIREBASE_SERVICE_ACCOUNT environment variable");
        process.exit(1);
      }
    }
    
    // Initialize Firebase Admin (SERVER-SIDE ONLY - No Analytics!)
    admin.initializeApp({
      credential: credential,
      // Do NOT add databaseURL or other client-side configs
    });
    
    console.log("✅ Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("❌ Firebase initialization failed:", error.message);
    process.exit(1);
  }
}

module.exports = admin;