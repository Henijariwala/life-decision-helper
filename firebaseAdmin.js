// firebaseAdmin.js - Firebase Admin SDK for Render Deployment
const admin = require("firebase-admin");

// Prevent multiple initializations
if (!admin.apps.length) {
  try {
    console.log("🔧 Initializing Firebase Admin SDK...");
    
    // Check if required environment variables exist
    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error("FIREBASE_PROJECT_ID environment variable is missing");
    }
    
    if (!process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error("FIREBASE_CLIENT_EMAIL environment variable is missing");
    }
    
    if (!process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error("FIREBASE_PRIVATE_KEY environment variable is missing");
    }
    
    console.log("📧 Project ID:", process.env.FIREBASE_PROJECT_ID);
    console.log("📧 Client Email:", process.env.FIREBASE_CLIENT_EMAIL);
    
    // Process the private key
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    // Handle different private key formats
    // Remove quotes if present
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      console.log("🔄 Removing surrounding quotes from private key");
      privateKey = privateKey.slice(1, -1);
    }
    
    // Replace literal \n with actual newlines
    if (privateKey.includes('\\n')) {
      console.log("🔄 Converting \\n to newlines");
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    // Validate the private key format
    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
      throw new Error(
        "Invalid private key format. Must contain 'BEGIN PRIVATE KEY'. " +
        "Current key preview: " + privateKey.substring(0, 50)
      );
    }
    
    if (!privateKey.includes('END PRIVATE KEY')) {
      throw new Error(
        "Incomplete private key. Must contain 'END PRIVATE KEY'. " +
        "The private key appears to be truncated. " +
        "Make sure you copied the ENTIRE key including the last line."
      );
    }
    
    console.log("✅ Private key format validated");
    console.log("   Length:", privateKey.length, "characters");
    console.log("   Has newlines:", privateKey.split('\n').length, "lines");
    
    // Initialize Firebase Admin with just the 3 required fields
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey
      })
    });
    
    console.log("✅ Firebase Admin initialized successfully");
    
    // Test Firestore connection
    const db = admin.firestore();
    console.log("✅ Firestore instance created");
    
  } catch (error) {
    console.error("\n❌ FIREBASE INITIALIZATION FAILED");
    console.error("=====================================");
    console.error("Error:", error.message);
    console.error("\n📋 Troubleshooting:");
    
    if (error.message.includes("private key")) {
      console.error("\n🔑 Private Key Issue:");
      console.error("1. Go to Render Dashboard → Environment");
      console.error("2. Check FIREBASE_PRIVATE_KEY variable");
      console.error("3. It should start with: -----BEGIN PRIVATE KEY-----");
      console.error("4. It should end with: -----END PRIVATE KEY-----");
      console.error("5. If it's cut off, you need to paste the COMPLETE key");
      console.error("\nTo get the complete key:");
      console.error("- Open your Firebase JSON file");
      console.error("- Copy the entire private_key value");
      console.error("- Make sure to include all lines until -----END PRIVATE KEY-----");
    } else if (error.message.includes("missing")) {
      console.error("\n🚨 Missing Environment Variables:");
      console.error("Go to Render Dashboard → Environment and add:");
      console.error("- FIREBASE_PROJECT_ID");
      console.error("- FIREBASE_CLIENT_EMAIL");
      console.error("- FIREBASE_PRIVATE_KEY");
    }
    
    console.error("\n=====================================\n");
    process.exit(1);
  }
} else {
  console.log("✅ Firebase Admin already initialized");
}

module.exports = admin;