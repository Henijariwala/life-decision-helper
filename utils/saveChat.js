const admin = require("../firebaseAdmin");

module.exports = async ({ email, chatId, messages, step }) => {
  if (!email) throw new Error("Email required");

  const db = admin.firestore();
  const chatsRef = db.collection("users").doc(email).collection("chats");
  const chatRef = chatId ? chatsRef.doc(chatId) : chatsRef.doc();

  const now = admin.firestore.FieldValue.serverTimestamp();

  await chatRef.set(
    {
      messages,
      step,
      updatedAt: now,
      ...(chatId ? {} : { createdAt: now })
    },
    { merge: true }
  );

  return chatRef.id;
};
