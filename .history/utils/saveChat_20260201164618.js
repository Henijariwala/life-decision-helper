const admin = require("../firebaseAdmin");

/**
 * Save or update a chat for a user
 *
 * Firestore structure:
 * users
 *  └── email@email.com
 *      └── chats
 *          └── chatId
 *              ├── messages[]
 *              ├── step
 *              ├── createdAt
 *              └── updatedAt
 */
module.exports = async function saveChat({
  email,
  chatId,
  messages,
  step
}) {
  if (!email) {
    throw new Error("saveChat: email is required");
  }

  const db = admin.firestore();

  // Reference to user's chats collection
  const chatsRef = db
    .collection("users")
    .doc(email)
    .collection("chats");

  // Use existing chatId or create a new one
  const chatRef = chatId ? chatsRef.doc(chatId) : chatsRef.doc();

  const now = admin.firestore.FieldValue.serverTimestamp();

  const data = {
    messages,
    step,
    updatedAt: now
  };

  // Set createdAt only once (on new chat)
  if (!chatId) {
    data.createdAt = now;
  }

  await chatRef.set(data, { merge: true });

  // Return chatId so UI can persist it
  return chatRef.id;
};