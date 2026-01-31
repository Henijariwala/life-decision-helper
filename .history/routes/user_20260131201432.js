const express = require("express");
const OpenAI = require("openai");
const requireAuth = require("../middleware/auth");
const saveChat = require("../utils/saveChat");
const admin = require("../firebaseAdmin");

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ---------- SYSTEM PROMPT ----------
const SYSTEM_PROMPT = `
You are a calm, empathetic assistant.
You talk naturally and support emotions.
Only start decision-making when the user is ready.
`;

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
  let reply = "";

  try {
    const {
      message,
      messages = "[]",
      chatId = ""
    } = req.body;

    // Safe JSON parse
    try {
      chatMessages = JSON.parse(messages);
      if (!Array.isArray(chatMessages)) chatMessages = [];
    } catch {
      chatMessages = [];
    }

    // Add user message
    chatMessages.push({
      role: "User",
      text: message,
      createdAt: Date.now()
    });

    // ---------- OPENAI CALL (SAFE) ----------
    try {
      const ai = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...chatMessages.map(m => ({
            role: m.role === "User" ? "user" : "assistant",
            content: m.text
          }))
        ]
      });

      reply = ai.choices[0].message.content;

    } catch (err) {
      console.error("OPENAI ERROR:", err.message);

      // Graceful fallback
      reply =
        "⚠️ AI is temporarily unavailable (quota or network issue).\n\n" +
        "Your message has been saved. Please try again later.";
    }

    // ---------- STEP PROGRESSION ----------
    if (
      currentStep === "EMOTIONAL" &&
      /help me decide|i'?m ready|start decision/i.test(message)
    ) {
      reply += "\n\n👉 Enter your options separated by commas.";
      currentStep = "OPTIONS";
    }

    // Add bot message
    chatMessages.push({
      role: "Bot",
      text: reply,
      createdAt: Date.now()
    });

    // ---------- SAVE CHAT ----------
    const newChatId = await saveChat({
      email: req.user.email,
      chatId,
      messages: chatMessages,
      step: currentStep
    });

    res.render("chat", {
      messages: chatMessages,
      step: currentStep,
      chatId: newChatId
    });

  } catch (err) {
    console.error("CHAT ROUTE ERROR:", err);
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
    console.error("HISTORY ERROR:", err);
    res.status(500).send("Failed to load history");
  }
});

module.exports = router;
