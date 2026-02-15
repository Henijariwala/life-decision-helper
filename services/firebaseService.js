const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Check if Firebase Admin is already initialized
if (!admin.apps.length) {
  try {
    console.log('🔧 Initializing Firebase Admin SDK...');
    
    // Path to service account key
    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
    
    // Check if service account file exists (local development)
    if (fs.existsSync(serviceAccountPath)) {
      console.log('📄 Using service account file from:', serviceAccountPath);
      
      const serviceAccount = require(serviceAccountPath);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      
      console.log('✅ Firebase Admin initialized successfully');
      console.log('📧 Project ID:', serviceAccount.project_id);
      console.log('📧 Client Email:', serviceAccount.client_email);
    } 
    // Use environment variables (production/Render deployment)
    else if (process.env.FIREBASE_PROJECT_ID && 
             process.env.FIREBASE_CLIENT_EMAIL && 
             process.env.FIREBASE_PRIVATE_KEY) {
      
      console.log('🌐 Using environment variables for Firebase');
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      });
      
      console.log('✅ Firebase Admin initialized with environment variables');
      console.log('📧 Project ID:', process.env.FIREBASE_PROJECT_ID);
    } 
    else {
      throw new Error(
        'Firebase credentials not found!\n' +
        'For local development: Download serviceAccountKey.json from Firebase Console\n' +
        'For production: Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables'
      );
    }
    
    // Test Firestore connection
    const db = admin.firestore();
    console.log('✅ Firestore connected');
    
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:');
    console.error('   Message:', error.message);
    console.error('\n📋 To fix this:');
    console.error('   1. Go to Firebase Console → Project Settings → Service Accounts');
    console.error('   2. Click "Generate new private key"');
    console.error('   3. Save as serviceAccountKey.json in project root');
    console.error('   4. Add serviceAccountKey.json to .gitignore');
    console.error('   5. Restart server\n');
    process.exit(1);
  }
} else {
  console.log('✅ Firebase Admin already initialized');
}

// Export admin instance
module.exports = admin;