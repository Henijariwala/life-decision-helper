// services/firebaseService.js - Firebase Database Operations
const admin = require("../firebaseAdmin"); // ← Changed from "../firebase"

class FirebaseService {
  static async saveChat(email, chatId, messages) {
    try {
      const db = admin.firestore();
      const chatData = {
        messages,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (chatId) {
        await db
          .collection("users")
          .doc(email)
          .collection("chats")
          .doc(chatId)
          .update(chatData);
        return chatId;
      } else {
        chatData.createdAt = admin.firestore.FieldValue.serverTimestamp();
        const chatRef = await db
          .collection("users")
          .doc(email)
          .collection("chats")
          .add(chatData);
        return chatRef.id;
      }
    } catch (error) {
      console.error("❌ Save chat error:", error);
      throw new Error("Failed to save chat");
    }
  }

  static async getChat(email, chatId) {
    try {
      const db = admin.firestore();
      const chatDoc = await db
        .collection("users")
        .doc(email)
        .collection("chats")
        .doc(chatId)
        .get();

      if (!chatDoc.exists) return null;

      return {
        id: chatDoc.id,
        ...chatDoc.data()
      };
    } catch (error) {
      console.error("❌ Get chat error:", error);
      throw new Error("Failed to load chat");
    }
  }

  static async getUserChats(email, limit = 50) {
    try {
      const db = admin.firestore();
      const chatsSnapshot = await db
        .collection("users")
        .doc(email)
        .collection("chats")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      return chatsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          messages: data.messages || [],
          createdAt: data.createdAt?.toDate(),
          preview: data.messages?.[0]?.text?.substring(0, 100) || "Empty chat"
        };
      });
    } catch (error) {
      console.error("❌ Get user chats error:", error);
      return [];
    }
  }

  static async deleteChat(email, chatId) {
    try {
      const db = admin.firestore();
      await db
        .collection("users")
        .doc(email)
        .collection("chats")
        .doc(chatId)
        .delete();
    } catch (error) {
      console.error("❌ Delete chat error:", error);
      throw new Error("Failed to delete chat");
    }
  }
}

module.exports = FirebaseService;