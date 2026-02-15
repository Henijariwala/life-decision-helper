const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const admin = require("../firebaseAdmin");

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// Helper function to sanitize email for Firestore document ID
function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') {
    throw new Error('Invalid email provided');
  }
  // Remove any characters that might cause issues in Firestore paths
  return email.trim().toLowerCase();
}

// HOME PAGE (Login)
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
    
    let messages = [];
    let currentChatId = chatId;

    if (chatId && chatId.trim() !== "") {
      try {
        const userEmail = sanitizeEmail(req.user.email);
        
        const chatDoc = await db
          .collection("users")
          .doc(userEmail)
          .collection("chats")
          .doc(chatId)
          .get();

        if (chatDoc.exists) {
          const data = chatDoc.data();
          messages = data.messages || [];
          console.log(`✅ Loaded chat ${chatId} with ${messages.length} messages`);
        } else {
          console.log("⚠️ Chat not found, starting new chat");
          currentChatId = "";
        }
      } catch (err) {
        console.error("❌ Error loading chat:", err.message);
        currentChatId = "";
      }
    }

    res.render("chat", { messages, chatId: currentChatId });
  } catch (error) {
    console.error("❌ Error loading chat page:", error.message);
    res.render("chat", { messages: [], chatId: "" });
  }
});

// CHAT PAGE - POST
router.post("/chat", requireAuth, async (req, res) => {
  const db = admin.firestore();
  
  console.log("📥 Request received");
  
  const { message, messages = "[]", chatId = "" } = req.body;
  
  // Validate message
  if (!message || typeof message !== 'string' || message.trim() === '') {
    console.error("❌ Empty or invalid message received");
    
    let chatMessages = [];
    try {
      chatMessages = JSON.parse(messages);
      if (!Array.isArray(chatMessages)) {
        chatMessages = [];
      }
    } catch (error) {
      chatMessages = [];
    }
    
    return res.render("chat", { 
      messages: chatMessages, 
      chatId: chatId 
    });
  }

  // Parse previous messages
  let chatMessages = [];
  try {
    chatMessages = JSON.parse(messages);
    if (!Array.isArray(chatMessages)) {
      chatMessages = [];
    }
  } catch (error) {
    console.error("❌ Error parsing messages:", error.message);
    chatMessages = [];
  }

  // Create timestamp in IST (Indian Standard Time)
  const timestamp = new Date().toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });

  // Add user message
  const userMessage = { 
    role: "user", 
    text: message.trim(),
    timestamp: timestamp
  };
  
  console.log("✅ User message:", userMessage.text.substring(0, 50) + "...");
  chatMessages.push(userMessage);

  // Save to Firebase
  let currentChatId = chatId;
  
  try {
    const userEmail = sanitizeEmail(req.user.email);
    console.log("📧 User email (sanitized):", userEmail);
    
    const userRef = db.collection("users").doc(userEmail);
    
    if (currentChatId && currentChatId.trim() !== "") {
      // Update existing chat
      console.log("🔄 Updating existing chat:", currentChatId);
      
      await userRef
        .collection("chats")
        .doc(currentChatId)
        .set({
          messages: chatMessages,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastMessage: message.trim(),
          messageCount: chatMessages.length,
          userId: userEmail
        }, { merge: true });
      
      console.log("✅ Updated existing chat:", currentChatId);
    } else {
      // Create new chat
      console.log("➕ Creating new chat");
      
      const newChatRef = await userRef
        .collection("chats")
        .add({
          messages: chatMessages,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastMessage: message.trim(),
          messageCount: chatMessages.length,
          userId: userEmail
        });
      
      currentChatId = newChatRef.id;
      console.log("✅ Created new chat:", currentChatId);
    }
  } catch (error) {
    console.error("❌ Firebase error:", error.message);
    console.error("Error code:", error.code);
    console.error("Error details:", error.details);
    
    // Continue with chat even if Firebase fails
    console.log("⚠️ Continuing without Firebase save");
  }

  // Get AI Response
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    console.log("🤖 Requesting AI response...");

    // Build conversation history
    const conversationHistory = chatMessages
      .filter(msg => msg.text && typeof msg.text === 'string' && msg.text.trim() !== '')
      .map(msg => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.text.trim()
      }));

    if (conversationHistory.length === 0) {
      throw new Error("No valid messages to send to AI");
    }

    // Call OpenAI API
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a supportive and insightful decision-making coach. Keep responses to 2-3 sentences maximum. Be warm, encouraging, and helpful.`
          },
          ...conversationHistory
        ],
        temperature: 0.7,
        max_tokens: 150,
        top_p: 0.95
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ OpenAI API Error:", errorData);
      throw new Error(errorData.error?.message || "AI request failed");
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || "I couldn't generate a response.";
    
    console.log("✅ AI response received");

    // Add bot message
    const botMessage = { 
      role: "assistant", 
      text: reply.trim(),
      timestamp: new Date().toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      })
    };
    
    chatMessages.push(botMessage);

    // Save bot message to Firebase
    if (currentChatId && currentChatId.trim() !== "") {
      try {
        const userEmail = sanitizeEmail(req.user.email);
        
        await db
          .collection("users")
          .doc(userEmail)
          .collection("chats")
          .doc(currentChatId)
          .set({
            messages: chatMessages,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastMessage: reply.trim(),
            messageCount: chatMessages.length
          }, { merge: true });
        
        console.log("✅ Bot message saved to Firebase");
      } catch (error) {
        console.error("❌ Error saving bot message:", error.message);
      }
    }

  } catch (error) {
    console.error("❌ AI ERROR:", error.message);

    // Add error message
    const errorMessage = {
      role: "assistant",
      text: `⚠️ ${error.message || 'Something went wrong. Please try again.'}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      }),
      isError: true
    };
    
    chatMessages.push(errorMessage);

    // Try to save error message
    if (currentChatId && currentChatId.trim() !== "") {
      try {
        const userEmail = sanitizeEmail(req.user.email);
        
        await db
          .collection("users")
          .doc(userEmail)
          .collection("chats")
          .doc(currentChatId)
          .set({
            messages: chatMessages,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
      } catch (fbError) {
        console.error("❌ Error saving error message:", fbError.message);
      }
    }
  }

  // Render chat page
  console.log("📄 Rendering chat with", chatMessages.length, "messages");
  res.render("chat", { messages: chatMessages, chatId: currentChatId });
});

// HISTORY PAGE
router.get("/history", requireAuth, async (req, res) => {
  try {
    const db = admin.firestore();
    const userEmail = sanitizeEmail(req.user.email);

    console.log("📚 Loading chat history for:", userEmail);

    const chatsSnap = await db
      .collection("users")
      .doc(userEmail)
      .collection("chats")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const decisions = chatsSnap.docs.map(doc => {
      const data = doc.data();
      
      let createdAt = null;
      if (data.createdAt) {
        createdAt = data.createdAt.toDate();
      }
      
      let preview = "Empty chat";
      if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
        const firstMessage = data.messages[0];
        if (firstMessage && firstMessage.text) {
          preview = firstMessage.text.substring(0, 150) + 
                    (firstMessage.text.length > 150 ? "..." : "");
        }
      }
      
      return {
        id: doc.id,
        messages: data.messages || [],
        createdAt: createdAt,
        preview: preview,
        messageCount: data.messageCount || (data.messages ? data.messages.length : 0)
      };
    });

    console.log(`✅ Loaded ${decisions.length} chat histories`);

    res.render("history", { decisions });
  } catch (error) {
    console.error("❌ History error:", error.message);
    console.error("Error code:", error.code);
    res.render("history", { decisions: [] });
  }
});

// DELETE CHAT
router.delete("/chat/:chatId", requireAuth, async (req, res) => {
  try {
    const db = admin.firestore();
    const chatId = req.params.chatId;
    const userEmail = sanitizeEmail(req.user.email);

    if (!chatId || chatId.trim() === "") {
      throw new Error("Invalid chat ID");
    }

    console.log("🗑️ Deleting chat:", chatId);

    await db
      .collection("users")
      .doc(userEmail)
      .collection("chats")
      .doc(chatId)
      .delete();

    console.log("✅ Chat deleted successfully");

    res.json({ success: true, message: "Chat deleted successfully" });
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