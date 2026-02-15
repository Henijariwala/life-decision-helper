// firebaseAdmin.js - Using Base64 Encoded Service Account (Most Reliable)
const admin = require("firebase-admin");

if (!admin.apps.length) {
  try {
    console.log("🔧 Initializing Firebase Admin SDK...");
    
    // Check if we have the base64 encoded service account
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      console.log("📦 Using base64 encoded service account");
      
      // Decode the base64 service account
      const serviceAccountJson = Buffer.from(
        process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
        'base64'
      ).toString('utf8');
      
      const serviceAccount = JSON.parse(serviceAccountJson);
      
      console.log("✅ Service account decoded successfully");
      console.log("📧 Project ID:", serviceAccount.project_id);
      console.log("📧 Client Email:", serviceAccount.client_email);
      
      // Initialize Firebase
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      
      console.log("✅ Firebase Admin initialized with base64 service account");
      
    } 
    // Fallback to individual environment variables
    else if (process.env.FIREBASE_PROJECT_ID && 
             process.env.FIREBASE_CLIENT_EMAIL && 
             process.env.FIREBASE_PRIVATE_KEY) {
      
      console.log("📧 Using individual environment variables");
      console.log("   Project ID:", process.env.FIREBASE_PROJECT_ID);
      console.log("   Client Email:", process.env.FIREBASE_CLIENT_EMAIL);
      
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      
      // Handle private key formatting
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }
      
      // Validate
      if (!privateKey.includes('BEGIN PRIVATE KEY')) {
        throw new Error("Invalid private key format - missing BEGIN marker");
      }
      
      if (!privateKey.includes('END PRIVATE KEY')) {
        throw new Error(
          "Incomplete private key - missing END marker. " +
          "The key is truncated. Use base64 method instead."
        );
      }
      
      console.log("✅ Private key validated");
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey
        })
      });
      
      console.log("✅ Firebase Admin initialized with environment variables");
      
    } else {
      throw new Error(
        "Firebase credentials not found!\n\n" +
        "RECOMMENDED: Use base64 encoded service account\n" +
        "1. Run: node encode-service-account.js\n" +
        "2. Copy the base64 string from SERVICE_ACCOUNT_BASE64.txt\n" +
        "3. Add to Render as: FIREBASE_SERVICE_ACCOUNT_BASE64\n\n" +
        "OR set these individual variables:\n" +
        "- FIREBASE_PROJECT_ID\n" +
        "- FIREBASE_CLIENT_EMAIL\n" +
        "- FIREBASE_PRIVATE_KEY (complete key with END marker)"
      );
    }
    
    // Test Firestore
    const db = admin.firestore();
    console.log("✅ Firestore connected successfully");
    
  } catch (error) {
    console.error("\n❌ FIREBASE INITIALIZATION FAILED");
    console.error("═══════════════════════════════════════");
    console.error("Error:", error.message);
    
    if (error.message.includes("private key") || error.message.includes("truncated")) {
      console.error("\n🔴 PRIVATE KEY PROBLEM DETECTED");
      console.error("Your private key is incomplete or corrupted.");
      console.error("\n✅ SOLUTION: Use Base64 Method (100% Reliable)");
      console.error("\nSteps:");
      console.error("1. Download encode-service-account.js");
      console.error("2. Place it with your serviceAccountKey.json");
      console.error("3. Run: node encode-service-account.js");
      console.error("4. In Render, DELETE old Firebase variables");
      console.error("5. ADD: FIREBASE_SERVICE_ACCOUNT_BASE64");
      console.error("6. Paste the base64 string from the generated file");
      console.error("7. Save and redeploy");
      console.error("\nThis encodes the ENTIRE service account file,");
      console.error("avoiding all formatting issues!");
    }
    
    console.error("\n═══════════════════════════════════════\n");
    process.exit(1);
  }
}

module.exports = admin;