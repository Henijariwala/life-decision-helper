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

// CHAT PAGE - GET (Protected Route)
router.get("/chat", requireAuth, async (req, res) => {
  try {
    const db = admin.firestore();
    const chatId = req.query.chatId;
    
    let messages = [];
    let currentChatId = "";

    // If chatId is provided, load existing chat
    if (chatId) {
      const chatDoc = await db
        .collection("users")
        .doc(req.user.email)
        .collection("chats")
        .doc(chatId)
        .get();

      if (chatDoc.exists) {
        const data = chatDoc.data();
        messages = data.messages || [];
        currentChatId = chatId;
      }
    }

    res.render("chat", { messages, chatId: currentChatId });
  } catch (error) {
    console.error("Error loading chat:", error);
    res.render("chat", { messages: [], chatId: "" });
  }
});

// CHAT PAGE - POST (Handle message submission)
router.post("/chat", requireAuth, async (req, res) => {
  const db = admin.firestore();
  const { message, messages = "[]", chatId = "" } = req.body;
  
  // Parse previous messages
  let chatMessages = [];
  try {
    chatMessages = JSON.parse(messages);
  } catch (error) {
    console.error("Error parsing messages:", error);
    chatMessages = [];
  }

  // Add user message
  const userMessage = { 
    role: "user", 
    text: message,
    timestamp: new Date().toLocaleTimeString(),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  chatMessages.push(userMessage);

  // Save user message to Firebase immediately
  let currentChatId = chatId;
  try {
    if (currentChatId) {
      // Update existing chat
      await db
        .collection("users")
        .doc(req.user.email)
        .collection("chats")
        .doc(currentChatId)
        .update({
          messages: chatMessages,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    } else {
      // Create new chat
      const newChatRef = await db
        .collection("users")
        .doc(req.user.email)
        .collection("chats")
        .add({
          messages: chatMessages,
          step: "EMOTIONAL",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      currentChatId = newChatRef.id;
    }
    
    console.log("✅ User message saved to Firebase");
  } catch (error) {
    console.error("❌ Error saving user message to Firebase:", error);
  }

  // Get AI Response
  try {
    // Check if API key exists
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set in environment variables");
    }

    console.log("🔄 Sending request to OpenAI API...");

    // Build conversation history for OpenAI
    const conversationHistory = chatMessages.map(msg => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.text
    }));

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
            content: "You are a wise and helpful decision-making assistant. Provide practical, thoughtful, and friendly advice to help users make better decisions. Keep responses concise but meaningful."
          },
          ...conversationHistory
        ],
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 0.95
      })
    });

    // Check response status
    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ OpenAI API Error:", JSON.stringify(errorData, null, 2));
      
      let errorMessage = "Unknown error";
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
      
      throw new Error(`API Error: ${response.status} - ${errorMessage}`);
    }

    const data = await response.json();
    console.log("✅ OpenAI Response Received");

    // Extract AI response
    const reply =
      data?.choices?.[0]?.message?.content ||
      "🤖 I couldn't generate a response. Please try again.";

    // Add bot message
    const botMessage = { 
      role: "assistant", 
      text: reply,
      timestamp: new Date().toLocaleTimeString(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    chatMessages.push(botMessage);

    // Save bot message to Firebase
    try {
      await db
        .collection("users")
        .doc(req.user.email)
        .collection("chats")
        .doc(currentChatId)
        .update({
          messages: chatMessages,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      
      console.log("✅ Bot message saved to Firebase");
    } catch (error) {
      console.error("❌ Error saving bot message to Firebase:", error);
    }

  } catch (error) {
    console.error("❌ ERROR:", error.message);

    // Add error message
    const errorMessage = {
      role: "assistant",
      text: `⚠️ AI error: ${error.message}`,
      timestamp: new Date().toLocaleTimeString(),
      isError: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    chatMessages.push(errorMessage);

    // Save error message to Firebase
    try {
      await db
        .collection("users")
        .doc(req.user.email)
        .collection("chats")
        .doc(currentChatId)
        .update({
          messages: chatMessages,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (fbError) {
      console.error("❌ Error saving error message to Firebase:", fbError);
    }
  }

  // Render chat page with updated messages
  res.render("chat", { messages: chatMessages, chatId: currentChatId });
});

// HISTORY PAGE - View all past chats
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
      return {
        id: doc.id,
        messages: data.messages || [],
        step: data.step,
        createdAt: data.createdAt,
        preview: data.messages && data.messages.length > 0 
          ? data.messages[0].text.substring(0, 100) + "..."
          : "No messages"
      };
    });

    res.render("history", { decisions });
  } catch (error) {
    console.error("HISTORY ERROR:", error);
    res.status(500).send("Failed to load history");
  }
});

// DELETE CHAT
router.delete("/chat/:chatId", requireAuth, async (req, res) => {
  try {
    const db = admin.firestore();
    const chatId = req.params.chatId;

    await db
      .collection("users")
      .doc(req.user.email)
      .collection("chats")
      .doc(chatId)
      .delete();

    res.json({ success: true, message: "Chat deleted successfully" });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// LOGOUT
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

module.exports = router;