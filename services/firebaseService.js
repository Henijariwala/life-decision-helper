const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    console.log('🔧 Initializing Firebase Admin SDK...');
    
    // Check if environment variables are set (Production/Render)
    if (process.env.FIREBASE_PROJECT_ID && 
        process.env.FIREBASE_CLIENT_EMAIL && 
        process.env.FIREBASE_PRIVATE_KEY) {
      
      console.log('🌐 Using environment variables for Firebase');
      console.log('📧 Project ID:', process.env.FIREBASE_PROJECT_ID);
      console.log('📧 Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
      
      // Initialize with environment variables
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Convert literal \n in string to actual newlines
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      });
      
      console.log('✅ Firebase Admin initialized successfully');
      console.log('✅ Firestore connected');
      
    } else {
      // Missing environment variables
      throw new Error(
        '❌ Firebase credentials not found!\n' +
        'Required environment variables:\n' +
        '  - FIREBASE_PROJECT_ID\n' +
        '  - FIREBASE_CLIENT_EMAIL\n' +
        '  - FIREBASE_PRIVATE_KEY\n\n' +
        'Please set these in your Render dashboard:\n' +
        '1. Go to your service settings\n' +
        '2. Click Environment tab\n' +
        '3. Add all three variables\n' +
        '4. Save and redeploy'
      );
    }
    
    // Test Firestore connection
    const db = admin.firestore();
    console.log('✅ Firestore instance created');
    
  } catch (error) {
    console.error('\n❌ FIREBASE INITIALIZATION FAILED:');
    console.error('Error:', error.message);
    console.error('\n📋 To fix this error:');
    console.error('1. Go to Firebase Console → Project Settings → Service Accounts');
    console.error('2. Generate new private key and download JSON');
    console.error('3. Extract these values from the JSON:');
    console.error('   - project_id → FIREBASE_PROJECT_ID');
    console.error('   - client_email → FIREBASE_CLIENT_EMAIL');
    console.error('   - private_key → FIREBASE_PRIVATE_KEY (include quotes and \\n)');
    console.error('4. Add them as environment variables in Render');
    console.error('5. Save and redeploy\n');
    
    // Exit process - server cannot run without Firebase
    process.exit(1);
  }
} else {
  console.log('✅ Firebase Admin already initialized');
}

// Export admin instance
module.exports = admin;