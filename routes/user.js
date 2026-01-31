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

    // ---------- SAFE JSON PARSE ----------
    try {
      chatMessages = JSON.parse(messages);
      if (!Array.isArray(chatMessages)) chatMessages = [];
    } catch {
      chatMessages = [];
    }

    // ---------- ADD USER MESSAGE ----------
    chatMessages.push({
      role: "User",
      text: message,
      createdAt: Date.now()
    });

    // ---------- OPENAI (SAFE + OPTIONAL) ----------
    if (process.env.OPENAI_API_KEY) {
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
        console.error("OPENAI ERROR:", err.code || err.message);

        reply =
          "⚠️ AI is temporarily unavailable (quota or network issue).\n\n" +
          "Your message was saved. Please try again later.";
      }
    } else {
      // Demo mode
      reply = "🤖 (Demo mode) I received your message.";
    }

    // ---------- STEP PROGRESSION ----------
    if (
      currentStep === "EMOTIONAL" &&
      /help me decide|i'?m ready|start decision/i.test(message)
    ) {
      reply += "\n\n👉 Enter your options separated by commas.";
      currentStep = "OPTIONS";
    }

    // ---------- ADD BOT MESSAGE ----------
    chatMessages.push({
      role: "Bot",
      text: reply,
      createdAt: Date.now()
    });

    // ---------- SAVE CHAT (SAFE) ----------
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
    console.error("HISTORY ERROR:", err.message);
    res.status(500).send("Failed to load history");
  }
});

module.exports = router;
