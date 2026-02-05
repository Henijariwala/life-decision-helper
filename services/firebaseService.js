// services/firebaseService.js - Firebase Database Operations
const { db, serverTimestamp } = require("../config/firebase");

class FirebaseService {
  /**
   * Save or update chat
   * @param {string} email - User email
   * @param {string} chatId - Chat ID (empty for new chat)
   * @param {Array} messages - Chat messages
   * @param {string} step - Current step in flow
   * @returns {Promise<string>} Chat ID
   */
  static async saveChat(email, chatId, messages, step = "EMOTIONAL") {
    try {
      const chatData = {
        messages,
        step,
        updatedAt: serverTimestamp()
      };

      if (chatId) {
        // Update existing chat
        await db
          .collection("users")
          .doc(email)
          .collection("chats")
          .doc(chatId)
          .update(chatData);
        
        return chatId;
      } else {
        // Create new chat
        chatData.createdAt = serverTimestamp();
        
        const chatRef = await db
          .collection("users")
          .doc(email)
          .collection("chats")
          .add(chatData);
        
        return chatRef.id;
      }
    } catch (error) {
      console.error("❌ Error saving chat:", error);
      throw new Error("Failed to save chat");
    }
  }

  /**
   * Get chat by ID
   * @param {string} email - User email
   * @param {string} chatId - Chat ID
   * @returns {Promise<Object|null>} Chat data
   */
  static async getChat(email, chatId) {
    try {
      const chatDoc = await db
        .collection("users")
        .doc(email)
        .collection("chats")
        .doc(chatId)
        .get();

      if (!chatDoc.exists) {
        return null;
      }

      return {
        id: chatDoc.id,
        ...chatDoc.data()
      };
    } catch (error) {
      console.error("❌ Error getting chat:", error);
      throw new Error("Failed to load chat");
    }
  }

  /**
   * Get all chats for a user
   * @param {string} email - User email
   * @param {number} limit - Number of chats to retrieve
   * @returns {Promise<Array>} Array of chats
   */
  static async getUserChats(email, limit = 50) {
    try {
      const chatsSnapshot = await db
        .collection("users")
        .doc(email)
        .collection("chats")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      return chatsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("❌ Error getting user chats:", error);
      throw new Error("Failed to load chat history");
    }
  }

  /**
   * Delete chat
   * @param {string} email - User email
   * @param {string} chatId - Chat ID
   * @returns {Promise<void>}
   */
  static async deleteChat(email, chatId) {
    try {
      await db
        .collection("users")
        .doc(email)
        .collection("chats")
        .doc(chatId)
        .delete();
    } catch (error) {
      console.error("❌ Error deleting chat:", error);
      throw new Error("Failed to delete chat");
    }
  }

  /**
   * Save decision result
   * @param {string} email - User email
   * @param {Object} decisionData - Decision data
   * @returns {Promise<string>} Decision ID
   */
  static async saveDecision(email, decisionData) {
    try {
      const decision = {
        ...decisionData,
        createdAt: serverTimestamp()
      };

      const decisionRef = await db
        .collection("users")
        .doc(email)
        .collection("decisions")
        .add(decision);

      return decisionRef.id;
    } catch (error) {
      console.error("❌ Error saving decision:", error);
      throw new Error("Failed to save decision");
    }
  }

  /**
   * Get all decisions for a user
   * @param {string} email - User email
   * @param {number} limit - Number of decisions to retrieve
   * @returns {Promise<Array>} Array of decisions
   */
  static async getUserDecisions(email, limit = 50) {
    try {
      const decisionsSnapshot = await db
        .collection("users")
        .doc(email)
        .collection("decisions")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      return decisionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("❌ Error getting user decisions:", error);
      throw new Error("Failed to load decision history");
    }
  }

  /**
   * Get admin analytics
   * @returns {Promise<Object>} Analytics data
   */
  static async getAdminAnalytics() {
    try {
      // Get total users
      const usersSnapshot = await db.collection("users").get();
      const totalUsers = usersSnapshot.size;

      // Get total chats
      let totalChats = 0;
      for (const userDoc of usersSnapshot.docs) {
        const chatsSnapshot = await db
          .collection("users")
          .doc(userDoc.id)
          .collection("chats")
          .get();
        totalChats += chatsSnapshot.size;
      }

      // Get total decisions
      let totalDecisions = 0;
      for (const userDoc of usersSnapshot.docs) {
        const decisionsSnapshot = await db
          .collection("users")
          .doc(userDoc.id)
          .collection("decisions")
          .get();
        totalDecisions += decisionsSnapshot.size;
      }

      return {
        totalUsers,
        totalChats,
        totalDecisions,
        timestamp: new Date()
      };
    } catch (error) {
      console.error("❌ Error getting analytics:", error);
      throw new Error("Failed to load analytics");
    }
  }
}

module.exports = FirebaseService;