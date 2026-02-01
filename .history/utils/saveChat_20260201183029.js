const admin = require("../firebaseAdmin");

module.exports = async ({ email, messages }) => {
  const db = admin.firestore();

  await db
    .collection("users")
    .doc(email)
    .collection("chats")
    .add({
      messages,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
};
