// firebaseAdmin.js - Firebase Admin SDK (Uses Environment Variables)
const admin = require("firebase-admin");

// Prevent multiple initializations
if (!admin.apps.length) {
  try {
    // Build service account from environment variables (Render deployment)
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID || "life-decision-helper",
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY 
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
    };

    // Validate required fields
    if (!serviceAccount.private_key || !serviceAccount.client_email) {
      console.error("❌ Missing Firebase credentials!");
      console.error("Required environment variables:");
      console.error("  - FIREBASE_PRIVATE_KEY");
      console.error("  - FIREBASE_CLIENT_EMAIL");
      console.error("  - FIREBASE_PROJECT_ID");
      process.exit(1);
    }

    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log("✅ Firebase Admin initialized with environment variables");
  } catch (error) {
    console.error("❌ Firebase initialization failed:", error.message);
    process.exit(1);
  }
}

module.exports = admin;