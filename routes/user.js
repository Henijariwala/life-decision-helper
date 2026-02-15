const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const admin = require("../firebaseAdmin");

// Test Firebase connection on startup
console.log('🧪 Testing Firebase connection...');
try {
  const db = admin.firestore();
  console.log('✅ Firestore accessible from routes');
} catch (error) {
  console.error('❌ Cannot access Firestore:', error.message);
}

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// Helper to sanitize email
function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') {
    throw new Error('Invalid email');
  }
  return email.trim().toLowerCase();
}

// HOME PAGE
router.get("/", (req, res) => {
  res.render("index");
});

// SIGNUP PAGE
router.get("/Signup", (req, res) => {
  res.render("Signup");
});

// CHAT PAGE - GET
router.get("/chat", requireAuth, async (req, res) => {
  try {
    const db = admin.firestore();
    const chatId = req.query.chatId || "";
    
    console.log("📖 Loading chat page for user:", req.user.email);
    
    let messages = [];
    let currentChatId = chatId;

    if (chatId && chatId.trim() !== "") {
      try {
        const userEmail = sanitizeEmail(req.user.email);
        
        console.log("🔍 Fetching chat:", chatId, "for user:", userEmail);
        
        const chatDoc = await db
          .collection("users")
          .doc(userEmail)
          .collection("chats")
          .doc(chatId)
          .get();

        if (chatDoc.exists) {
          const data = chatDoc.data();
          messages = data.messages || [];
          console.log(`✅ Loaded ${messages.length} messages`);
        } else {
          console.log("⚠️ Chat not found");
          currentChatId = "";
        }
      } catch (err) {
        console.error("❌ Error loading chat:", err);
        currentChatId = "";
      }
    }

    res.render("chat", { messages, chatId: currentChatId });
  } catch (error) {
    console.error("❌ Page load error:", error);
    res.render("chat", { messages: [], chatId: "" });
  }
});

// CHAT PAGE - POST
router.post("/chat", requireAuth, async (req, res) => {
  console.log("\n==========================================");
  console.log("📨 NEW MESSAGE REQUEST");
  console.log("==========================================");
  
  try {
    const db = admin.firestore();
    const { message, messages = "[]", chatId = "" } = req.body;
    
    console.log("👤 User:", req.user.email);
    console.log("💬 Message:", message);
    
    if (!message || message.trim() === '') {
      console.error("❌ Empty message");
      return res.render("chat", { messages: JSON.parse(messages), chatId });
    }
    
    // Parse messages
    let chatMessages = JSON.parse(messages);
    
    // Add user message
    const userMessage = {
      role: "user",
      text: message.trim(),
      timestamp: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      })
    };
    
    chatMessages.push(userMessage);
    console.log("➕ Added user message");
    
    // Save to Firebase
    const userEmail = req.user.email.trim().toLowerCase();
    let currentChatId = chatId;
    
    console.log("💾 Saving to Firebase...");
    console.log("   Collection: users/" + userEmail + "/chats");
    
    const userRef = db.collection("users").doc(userEmail);
    const chatData = {
      messages: chatMessages,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastMessage: message.trim(),
      messageCount: chatMessages.length,
      userId: userEmail
    };
    
    if (currentChatId && currentChatId.trim() !== "") {
      console.log("🔄 Updating existing chat:", currentChatId);
      
      await userRef
        .collection("chats")
        .doc(currentChatId)
        .set(chatData, { merge: true });
      
      console.log("✅ Chat updated");
    } else {
      console.log("➕ Creating new chat");
      
      chatData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      
      const newChatRef = await userRef
        .collection("chats")
        .add(chatData);
      
      currentChatId = newChatRef.id;
      console.log("✅ NEW CHAT CREATED:", currentChatId);
    }
    
    // VERIFY the save
    console.log("🔍 Verifying save...");
    const verifyDoc = await userRef.collection("chats").doc(currentChatId).get();
    
    if (verifyDoc.exists) {
      console.log("✅ VERIFIED: Chat exists in Firebase!");
      console.log("   Messages:", verifyDoc.data().messages.length);
    } else {
      console.error("❌ VERIFICATION FAILED: Chat not found!");
    }
    
    // Get AI response (simplified for now)
    const botMessage = {
      role: "assistant",
      text: "I'm here to help! (Testing - AI integration pending)",
      timestamp: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      })
    };
    
    chatMessages.push(botMessage);
    
    // Save AI response
    await userRef.collection("chats").doc(currentChatId).set({
      messages: chatMessages,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastMessage: botMessage.text,
      messageCount: chatMessages.length
    }, { merge: true });
    
    console.log("✅ AI message saved");
    console.log("==========================================\n");
    
    res.render("chat", { messages: chatMessages, chatId: currentChatId });
    
  } catch (error) {
    console.error("❌ ROUTE ERROR:");
    console.error("   Message:", error.message);
    console.error("   Code:", error.code);
    console.error("   Stack:", error.stack);
    
    res.render("chat", { messages: [], chatId: "" });
  }
});

// HISTORY PAGE
router.get("/history", requireAuth, async (req, res) => {
  try {
    const db = admin.firestore();
    const userEmail = sanitizeEmail(req.user.email);

    console.log("📚 Loading history for:", userEmail);

    const chatsSnap = await db
      .collection("users")
      .doc(userEmail)
      .collection("chats")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    console.log("📊 Found", chatsSnap.docs.length, "chats");

    const decisions = chatsSnap.docs.map(doc => {
      const data = doc.data();
      
      return {
        id: doc.id,
        messages: data.messages || [],
        createdAt: data.createdAt ? data.createdAt.toDate() : null,
        preview: data.messages?.[0]?.text?.substring(0, 150) || "Empty chat",
        messageCount: data.messageCount || 0
      };
    });

    res.render("history", { decisions });
  } catch (error) {
    console.error("❌ History error:", error.message);
    res.render("history", { decisions: [] });
  }
});

// DELETE CHAT
router.delete("/chat/:chatId", requireAuth, async (req, res) => {
  try {
    const db = admin.firestore();
    const userEmail = sanitizeEmail(req.user.email);

    console.log("🗑️ Deleting chat:", req.params.chatId);

    await db
      .collection("users")
      .doc(userEmail)
      .collection("chats")
      .doc(req.params.chatId)
      .delete();

    console.log("✅ Deleted");
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Delete error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// LOGOUT
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

module.exports = router;