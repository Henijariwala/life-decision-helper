const admin = require("firebase-admin");

// IMPORTANT:
// serviceAccount.json MUST be in src/ OR path adjusted
const serviceAccount = require("./serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
