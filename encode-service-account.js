// encode-service-account.js
// This encodes your ENTIRE Firebase service account as base64
// This is the MOST RELIABLE method for Render deployment

const fs = require('fs');

console.log('🔧 Firebase Service Account Encoder\n');

// Check if file exists
if (!fs.existsSync('./serviceAccountKey.json')) {
  console.error('❌ Error: serviceAccountKey.json not found!');
  console.error('Please place the Firebase JSON file in the same directory.\n');
  process.exit(1);
}

// Read the entire service account file
const serviceAccount = fs.readFileSync('./serviceAccountKey.json', 'utf8');

// Encode the ENTIRE file as base64
const base64ServiceAccount = Buffer.from(serviceAccount).toString('base64');

// Save to file
fs.writeFileSync('SERVICE_ACCOUNT_BASE64.txt', base64ServiceAccount);

console.log('✅ Service account encoded successfully!');
console.log('📄 Saved to: SERVICE_ACCOUNT_BASE64.txt\n');
console.log('📋 Next steps:\n');
console.log('1. Open SERVICE_ACCOUNT_BASE64.txt');
console.log('2. Copy ALL its contents (one long string)');
console.log('3. Go to Render → Environment');
console.log('4. DELETE these variables if they exist:');
console.log('   - FIREBASE_PROJECT_ID');
console.log('   - FIREBASE_CLIENT_EMAIL');
console.log('   - FIREBASE_PRIVATE_KEY');
console.log('5. ADD one new variable:');
console.log('   Key: FIREBASE_SERVICE_ACCOUNT_BASE64');
console.log('   Value: (paste the base64 string)');
console.log('6. Save Changes\n');
console.log('📊 Base64 length:', base64ServiceAccount.length, 'characters');
console.log('✅ This method is foolproof - no formatting issues!\n');