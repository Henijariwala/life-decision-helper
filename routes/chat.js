// routes/chat.js - Chat Routes
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const AIService = require("../services/aiService");
const FirebaseService = require("../services/firebaseService");

// GET /chat - Load chat interface
router.get("/", requireAuth, async (req, res) => {
  try {
    const chatId = req.query.chatId || "";
    let messages = [];
    let currentChatId = chatId;

    if (chatId) {
      const chat = await FirebaseService.getChat(req.user.email, chatId);
      if (chat) {
        messages = chat.messages || [];
      } else {
        currentChatId = "";
      }
    }

    res.render("chat", {
      messages,
      chatId: currentChatId,
      user: req.user
    });
  } catch (error) {
    console.error("❌ Chat load error:", error);
    res.render("chat", {
      messages: [],
      chatId: "",
      user: req.user
    });
  }
});

// POST /chat - Send message
router.post("/", requireAuth, async (req, res) => {
  const { message, messages = "[]", chatId = "" } = req.body;
  
  let chatMessages = [];
  try {
    chatMessages = JSON.parse(messages);
  } catch (error) {
    chatMessages = [];
  }

  // Add user message
  const userMessage = {
    role: "user",
    text: message,
    timestamp: new Date().toLocaleTimeString()
  };
  
  chatMessages.push(userMessage);

  let currentChatId = chatId;

  // Save user message
  try {
    currentChatId = await FirebaseService.saveChat(
      req.user.email,
      chatId,
      chatMessages
    );
  } catch (error) {
    console.error("❌ Save error:", error);
  }

  // Get AI response
  try {
    const aiResponse = await AIService.chat(chatMessages);

    const botMessage = {
      role: "assistant",
      text: aiResponse,
      timestamp: new Date().toLocaleTimeString()
    };
    
    chatMessages.push(botMessage);

    // Save with AI response
    await FirebaseService.saveChat(
      req.user.email,
      currentChatId,
      chatMessages
    );
  } catch (error) {
    console.error("❌ AI error:", error);
    
    const errorMessage = {
      role: "assistant",
      text: `⚠️ ${error.message}`,
      timestamp: new Date().toLocaleTimeString(),
      isError: true
    };
    
    chatMessages.push(errorMessage);

    if (currentChatId) {
      await FirebaseService.saveChat(
        req.user.email,
        currentChatId,
        chatMessages
      );
    }
  }

  res.render("chat", {
    messages: chatMessages,
    chatId: currentChatId,
    user: req.user
  });
});

// DELETE /chat/:chatId - Delete chat
router.delete("/:chatId", requireAuth, async (req, res) => {
  try {
    await FirebaseService.deleteChat(req.user.email, req.params.chatId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;