// config/firebase.js - Firebase Admin SDK Configuration
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
      })
    });
    
    console.log("✅ Firebase Admin initialized successfully");
  } catch (error) {
    console.error("❌ Firebase Admin initialization failed:", error.message);
    process.exit(1);
  }
}

const db = admin.firestore();
const auth = admin.auth();

// Firestore settings
db.settings({
  timestampsInSnapshots: true
});

module.exports = {
  admin,
  db,
  auth,
  
  // Helper functions
  serverTimestamp: () => admin.firestore.FieldValue.serverTimestamp(),
  increment: (value) => admin.firestore.FieldValue.increment(value),
  arrayUnion: (value) => admin.firestore.FieldValue.arrayUnion(value),
  arrayRemove: (value) => admin.firestore.FieldValue.arrayRemove(value)
};