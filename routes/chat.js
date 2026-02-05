// routes/chat.js - Chat Routes (Emotional Support → Decision Making)
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");
const AIService = require("../services/aiService");
const FirebaseService = require("../services/firebaseService");

// GET /chat - Load chat interface
router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const chatId = req.query.chatId || "";
  let messages = [];
  let step = "EMOTIONAL";

  // Load existing chat if chatId provided
  if (chatId) {
    const chat = await FirebaseService.getChat(req.user.email, chatId);
    if (chat) {
      messages = chat.messages || [];
      step = chat.step || "EMOTIONAL";
    }
  }

  res.render("user/chat", {
    title: "Decision Chat",
    messages,
    chatId,
    step
  });
}));

// POST /chat - Send message
router.post("/", requireAuth, asyncHandler(async (req, res) => {
  const { message, messages = "[]", chatId = "", step = "EMOTIONAL" } = req.body;
  
  let chatMessages = JSON.parse(messages);
  let currentStep = step;

  // Add user message
  chatMessages.push({
    role: "user",
    text: message,
    timestamp: new Date().toLocaleTimeString()
  });

  // Get AI response based on step
  let aiResponse;
  if (currentStep === "EMOTIONAL") {
    aiResponse = await AIService.getEmotionalSupport(chatMessages);
    
    // Check if user is ready for decision-making
    if (AIService.isReadyForDecision(message)) {
      currentStep = "DECISION_INPUT";
      aiResponse += " What decision would you like help with? Please describe your situation.";
    }
  } else {
    aiResponse = await AIService.getDecisionGuidance(chatMessages);
  }

  // Add AI response
  chatMessages.push({
    role: "assistant",
    text: aiResponse,
    timestamp: new Date().toLocaleTimeString()
  });

  // Save to Firebase
  const newChatId = await FirebaseService.saveChat(
    req.user.email,
    chatId,
    chatMessages,
    currentStep
  );

  res.render("user/chat", {
    title: "Decision Chat",
    messages: chatMessages,
    chatId: newChatId,
    step: currentStep
  });
}));

module.exports = router;