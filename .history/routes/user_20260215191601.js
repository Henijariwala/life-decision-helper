const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const admin = require("../firebaseAdmin");

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

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

    if (chatId) {
      try {
        const chatDoc = await db
          .collection("users")
          .doc(req.user.email)
          .collection("chats")
          .doc(chatId)
          .get();

        if (chatDoc.exists) {
          const data = chatDoc.data();
          messages = data.messages || [];
          console.log(`✅ Loaded chat ${chatId} with ${messages.length} messages`);
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
    console.error("❌ Error loading chat page:", error);
    res.render("chat", { messages: [], chatId: "" });
  }
});

// CHAT PAGE - POST
router.post("/chat", requireAuth, async (req, res) => {
  const db = admin.firestore();
  const { message, messages = "[]", chatId = "" } = req.body;
  
  if (!message || typeof message !== 'string' || message.trim() === '') {
    console.error("❌ Empty message");
    let chatMessages = [];
    try {
      chatMessages = JSON.parse(messages);
      if (!Array.isArray(chatMessages)) chatMessages = [];
    } catch (error) {
      chatMessages = [];
    }
    return res.render("chat", { messages: chatMessages, chatId: chatId });
  }

  let chatMessages = [];
  try {
    chatMessages = JSON.parse(messages);
    if (!Array.isArray(chatMessages)) chatMessages = [];
  } catch (error) {
    chatMessages = [];
  }

  const timestamp = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', minute: '2-digit', hour12: true 
  });

  const userMessage = { 
    role: "user", 
    text: message.trim(),
    timestamp: timestamp
  };
  
  chatMessages.push(userMessage);

  let currentChatId = chatId;
  
  try {
    const userRef = db.collection("users").doc(req.user.email);
    
    if (currentChatId) {
      await userRef.collection("chats").doc(currentChatId).update({
        messages: chatMessages,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessage: message.trim(),
        messageCount: chatMessages.length
      });
      console.log("✅ Updated chat:", currentChatId);
    } else {
      const newChatRef = await userRef.collection("chats").add({
        messages: chatMessages,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessage: message.trim(),
        messageCount: chatMessages.length,
        userId: req.user.email
      });
      currentChatId = newChatRef.id;
      console.log("✅ Created chat:", currentChatId);
    }
  } catch (error) {
    console.error("❌ Firebase error:", error);
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const conversationHistory = chatMessages
      .filter(msg => msg.text && typeof msg.text === 'string' && msg.text.trim() !== '')
      .map(msg => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.text.trim()
      }));

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
            content: `You are a supportive decision-making coach. Keep responses to 2-3 sentences. Be warm, encouraging, and helpful.`
          },
          ...conversationHistory
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "AI request failed");
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || "I couldn't generate a response.";
    
    const botMessage = { 
      role: "assistant", 
      text: reply.trim(),
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', minute: '2-digit', hour12: true 
      })
    };
    
    chatMessages.push(botMessage);

    await db.collection("users").doc(req.user.email)
      .collection("chats").doc(currentChatId).update({
        messages: chatMessages,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessage: reply.trim(),
        messageCount: chatMessages.length
      });

  } catch (error) {
    console.error("❌ AI error:", error.message);
    const errorMessage = {
      role: "assistant",
      text: `⚠️ ${error.message}`,
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', minute: '2-digit', hour12: true 
      }),
      isError: true
    };
    chatMessages.push(errorMessage);

    if (currentChatId) {
      try {
        await db.collection("users").doc(req.user.email)
          .collection("chats").doc(currentChatId).update({
            messages: chatMessages,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
      } catch (e) {
        console.error("❌ Error saving error:", e);
      }
    }
  }

  res.render("chat", { messages: chatMessages, chatId: currentChatId });
});

// HISTORY PAGE
router.get("/history", requireAuth, async (req, res) => {
  try {
    const db = admin.firestore();

    const chatsSnap = await db
      .collection("users")
      .doc(req.user.email)
      .collection("chats")
      .orderBy("createdAt", "desc")
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

    res.render("history", { decisions });
  } catch (error) {
    console.error("❌ History error:", error);
    res.status(500).send("Failed to load history");
  }
});

// DELETE CHAT
router.delete("/chat/:chatId", requireAuth, async (req, res) => {
  try {
    const db = admin.firestore();
    await db.collection("users").doc(req.user.email)
      .collection("chats").doc(req.params.chatId).delete();
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Delete error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// LOGOUT
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

module.exports = router;