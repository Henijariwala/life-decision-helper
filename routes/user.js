const express = require("express");
const requireAuth = require("../middleware/auth");
const saveChat = require("../utils/saveChat");
const admin = require("../firebaseAdmin");

const router = express.Router();

// ---------- HOME ----------
router.get("/", (req, res) => {
  res.render("index");
});

// ---------- CHAT PAGE ----------
router.get("/chat", requireAuth, (req, res) => {
  res.render("chat", {
    messages: [],
    step: "EMOTIONAL",
    chatId: ""
  });
});

// ---------- CHAT POST ----------
router.post("/chat", requireAuth, async (req, res) => {
  let chatMessages = [];
  let currentStep = req.body.step || "EMOTIONAL";

  try {
    const {
      message,
      messages = "[]",
      chatId = ""
    } = req.body;

    // ---------- SAFE PARSE ----------
    try {
      chatMessages = JSON.parse(messages);
      if (!Array.isArray(chatMessages)) chatMessages = [];
    } catch {
      chatMessages = [];
    }

    // ---------- USER MESSAGE ----------
    chatMessages.push({
      role: "User",
      text: message,
      createdAt: Date.now()
    });

    // ---------- DEMO MODE BOT REPLY ----------
    let reply =
      "🤖 I’m here and listening.\n\n" +
      "Tell me more about what’s on your mind.";

    // ---------- STEP PROGRESSION ----------
    if (
      currentStep === "EMOTIONAL" &&
      /help me decide|i'?m ready|start decision/i.test(message)
    ) {
      reply =
        "Got it 👍\n\n" +
        "👉 Please enter your options separated by commas.";
      currentStep = "OPTIONS";
    }

    // ---------- BOT MESSAGE ----------
    chatMessages.push({
      role: "Bot",
      text: reply,
      createdAt: Date.now()
    });

    // ---------- SAVE CHAT ----------
    let newChatId = chatId;
    try {
      newChatId = await saveChat({
        email: req.user.email,
        chatId,
        messages: chatMessages,
        step: currentStep
      });
    } catch (err) {
      console.error("FIRESTORE SAVE ERROR:", err.message);
    }

    res.render("chat", {
      messages: chatMessages,
      step: currentStep,
      chatId: newChatId
    });

  } catch (err) {
    console.error("CHAT ERROR:", err);
    res.status(500).send("Something went wrong. Please try again.");
  }
});

// ---------- HISTORY ----------
router.get("/history", requireAuth, async (req, res) => {
  try {
    const db = admin.firestore();

    const snap = await db
      .collection("users")
      .doc(req.user.email)
      .collection("chats")
      .orderBy("createdAt", "desc")
      .get();

    const decisions = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.render("history", { decisions });

  } catch (err) {
    console.error("HISTORY ERROR:", err.message);
    res.status(500).send("Failed to load history");
  }
});

module.exports = router;
