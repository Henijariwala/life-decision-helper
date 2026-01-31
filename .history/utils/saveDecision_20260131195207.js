const admin = require("../firebaseAdmin");

module.exports = async ({ email, chatId, messages, step }) => {
  const db = admin.firestore();

  const ref = chatId
    ? db.collection("users").doc(email).collection("chats").doc(chatId)
    : db.collection("users").doc(email).collection("chats").doc();

  await ref.set(
    {
      messages,
      step,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  return ref.id;
};
