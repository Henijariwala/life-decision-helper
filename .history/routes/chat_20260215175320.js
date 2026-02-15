// routes/chat.js - Chat Routes (Refactored)
const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const admin = require("../firebaseAdmin");
const AIService = require("../services/aiService");

/**
 * GET /chat - Load chat interface
 * Supports loading existing chats via chatId query parameter
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const db = admin.firestore();
    const chatId = req.query.chatId || "";
    
    let messages = [];
    let currentChatId = chatId;
    let step = "EMOTIONAL";

    // Load existing chat if chatId provided
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
          step = data.step || "EMOTIONAL";
        } else {
          console.log("Chat not found, starting new chat");
          currentChatId = "";
        }
      } catch (err) {
        console.error("Error loading chat:", err);
        currentChatId = "";
      }
    }

    res.render("chat", { 
      messages, 
      chatId: currentChatId,
      step 
    });
  } catch (error) {
    console.error("Error loading chat page:", error);
    res.render("chat", { 
      messages: [], 
      chatId: "",
      step: "EMOTIONAL"
    });
  }
});

/**
 * POST /chat - Handle message submission
 * Processes user messages and gets AI responses
 */
router.post("/", requireAuth, async (req, res) => {
  const db = admin.firestore();
  const { message, messages = "[]", chatId = "", step = "EMOTIONAL" } = req.body;
  
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
    timestamp: new Date().toLocaleTimeString()
  };
  
  chatMessages.push(userMessage);

  // Track current step
  let currentStep = step;
  let currentChatId = chatId;

  // Save user message to Firebase immediately
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
          step: currentStep,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      console.log("✅ Updated existing chat:", currentChatId);
    } else {
      // Create new chat
      const newChatRef = await db
        .collection("users")
        .doc(req.user.email)
        .collection("chats")
        .add({
          messages: chatMessages,
          step: currentStep,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      currentChatId = newChatRef.id;
      console.log("✅ Created new chat:", currentChatId);
    }
  } catch (error) {
    console.error("❌ Error saving user message to Firebase:", error);
  }

  // Get AI Response based on current step
  try {
    let aiResponse;

    if (currentStep === "EMOTIONAL") {
      // Get emotional support response
      aiResponse = await AIService.getEmotionalSupport(chatMessages);
      
      // Check if user is ready to transition to decision-making
      if (AIService.isReadyForDecision(message)) {
        currentStep = "DECISION_INPUT";
        aiResponse += " What decision would you like help with? Please describe your situation.";
      }
    } else {
      // Get decision-making guidance
      aiResponse = await AIService.getDecisionGuidance(chatMessages);
    }

    // Add bot message
    const botMessage = { 
      role: "assistant", 
      text: aiResponse,
      timestamp: new Date().toLocaleTimeString()
    };
    
    chatMessages.push(botMessage);

    // Save bot message to Firebase
    await db
      .collection("users")
      .doc(req.user.email)
      .collection("chats")
      .doc(currentChatId)
      .update({
        messages: chatMessages,
        step: currentStep,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    
    console.log("✅ Bot message saved to Firebase");

  } catch (error) {
    console.error("❌ AI ERROR:", error.message);

    // Add error message
    const errorMessage = {
      role: "assistant",
      text: `⚠️ ${error.message}`,
      timestamp: new Date().toLocaleTimeString(),
      isError: true
    };
    
    chatMessages.push(errorMessage);

    // Save error message to Firebase
    if (currentChatId) {
      try {
        await db
          .collection("users")
          .doc(req.user.email)
          .collection("chats")
          .doc(currentChatId)
          .update({
            messages: chatMessages,
            step: currentStep,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
      } catch (fbError) {
        console.error("❌ Error saving error message to Firebase:", fbError);
      }
    }
  }

  // Render chat page with updated messages
  res.render("chat", { 
    messages: chatMessages, 
    chatId: currentChatId,
    step: currentStep
  });
});

/**
 * DELETE /chat/:chatId - Delete a chat
 */
router.delete("/:chatId", requireAuth, async (req, res) => {
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

module.exports = router;