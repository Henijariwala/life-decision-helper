const express = require("express");
const OpenAI = require("openai");
const requireAuth = require("../middleware/auth");
const saveChat = require("../utils/saveChat");
const admin = require("../firebaseAdmin");

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
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

// ---------- SIGNUP ----------
router.get("/signup", (req, res) => {
  res.render("signup");
});

// ---------- CHAT ----------
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
    const { message, messages = "[]", chatId = "" } = req.body;
    chatMessages = JSON.parse(messages);

    // User message
    chatMessages.push({
      role: "User",
      text: message,
      createdAt: Date.now()
    });

    // -------- TRY REAL OPENAI ----------
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

    let reply = ai.choices[0].message.content;

    if (
      currentStep === "EMOTIONAL" &&
      /help me decide|i'?m ready|start decision/i.test(message)
    ) {
      reply += "\n\n👉 Enter your options separated by commas.";
      currentStep = "OPTIONS";
    }

    chatMessages.push({
      role: "Bot",
      text: reply,
      createdAt: Date.now()
    });

    const newChatId = await saveChat({
      email: req.user.email,
      chatId,
      messages: chatMessages,
      step: currentStep
    });

    return res.render("chat", {
      messages: chatMessages,
      step: currentStep,
      chatId: newChatId
    });

  } catch (err) {
    console.error("CHAT ERROR:", err);

    // ---------- MOCK AI FALLBACK ----------
    let mockReply;

    if (currentStep === "EMOTIONAL") {
      mockReply =
        "Hey 🙂 I’m here with you. Want to talk about what’s been on your mind lately?";
    } else if (currentStep === "OPTIONS") {
      mockReply =
        "Got it. Please list your options separated by commas, and we’ll go through them together.";
    } else {
      mockReply =
        "I’m still here. Let’s take this one step at a time.";
    }

    chatMessages.push({
      role: "Bot",
      text: mockReply,
      createdAt: Date.now()
    });

    return res.render("chat", {
      messages: chatMessages,
      step: currentStep,
      chatId: req.body.chatId || ""
    });
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
