const express = require("express");
const OpenAI = require("openai");
const requireAuth = require("../middleware/auth");
const saveChat = require("../utils/saveChat");
const admin = require("../firebaseAdmin");

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// System prompt
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

  const { message, messages = "[]", chatId = "" } = req.body;
  const userText = message.toLowerCase();

  chatMessages = JSON.parse(messages);

  // Save user message
  chatMessages.push({
    role: "User",
    text: message,
    createdAt: Date.now()
  });

  try {
    // 🔵 REAL OPENAI (if available)
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
      /help me decide|i'?m ready|start decision/i.test(userText)
    ) {
      reply += "\n\n👉 Enter your options separated by commas.";
      currentStep = "OPTIONS";
    }

    chatMessages.push({
      role: "Bot",
      text: reply,
      createdAt: Date.now()
    });

  } catch (err) {
    console.error("OPENAI ERROR — USING MOCK AI");

    // 🟡 SMART MOCK AI
    let mockReply;

    // Comparison / decision questions
    if (
      userText.includes("which") ||
      userText.includes("better") ||
      userText.includes("best") ||
      userText.includes(" or ")
    ) {
      mockReply =
        "Good question 🙂 Let’s compare:\n\n" +
        "🍫 **Morde Dark Chocolate**\n" +
        "• Rich cocoa taste\n" +
        "• Higher cocoa percentage\n\n" +
        "🍫 **Amul Sugar Free Chocolate**\n" +
        "• Lower sugar\n" +
        "• Milder taste\n\n" +
        "👉 Choose **Morde Dark** for taste.\n" +
        "👉 Choose **Amul Sugar Free** for sugar control.\n\n" +
        "Want help deciding based on your priority?";
      currentStep = "DECISION";
    }

    // User ready to decide
    else if (/help me decide|i'?m ready|start decision/i.test(userText)) {
      mockReply = "Great 👍 Please enter your options separated by commas.";
      currentStep = "OPTIONS";
    }

    // Default emotional response
    else {
      mockReply =
        "Hey 🙂 I’m here with you. Want to talk about what’s been on your mind lately?";
    }

    chatMessages.push({
      role: "Bot",
      text: mockReply,
      createdAt: Date.now()
    });
  }

  // Save chat
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
});

// ---------- HISTORY ----------
router.get("/history", requireAuth, async (req, res) => {
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
});

module.exports = router;
