const admin = require('firebase-admin');

if (!admin.apps.length) {
  try {
    console.log('🔧 Initializing Firebase...');
    
    // Decode base64 key
    const privateKey = Buffer.from(
      process.env.FIREBASE_PRIVATE_KEY_BASE64,
      'base64'
    ).toString('utf8');
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey
      })
    });
    
    console.log('✅ Firebase initialized');
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

module.exports = admin;