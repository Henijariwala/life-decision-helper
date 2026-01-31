const express = require("express");
const admin = require("../firebaseAdmin");
const OpenAI = require("openai");
const requireAuth = require("../middleware/auth");
const saveChat = require("../utils/saveChat");

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.get("/", (req, res) => {
  res.render("index");
});

router.get("/chat", requireAuth, (req, res) => {
  res.render("chat", { messages: [], step: "EMOTIONAL", chatId: "" });
});

router.post("/chat", requireAuth, async (req, res) => {
  const { message, messages = "[]", step = "EMOTIONAL", chatId } = req.body;

  let chatMessages = JSON.parse(messages);
  chatMessages.push({ role: "User", text: message, createdAt: Date.now() });

  const ai = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: chatMessages.map(m => ({
      role: m.role === "User" ? "user" : "assistant",
      content: m.text
    }))
  });

  const reply = ai.choices[0].message.content;
  chatMessages.push({ role: "Bot", text: reply, createdAt: Date.now() });

  const newChatId = await saveChat({
    email: req.user.email,
    chatId,
    messages: chatMessages,
    step
  });

  res.render("chat", {
    messages: chatMessages,
    step,
    chatId: newChatId
  });
});

router.get("/history", requireAuth, async (req, res) => {
  const admin = require("../firebaseAdmin");
  const db = admin.firestore();

  const snap = await db
    .collection("users")
    .doc(req.user.email)
    .collection("chats")
    .orderBy("createdAt", "desc")
    .get();

  const decisions = snap.docs.map(d => d.data());
  res.render("history", { decisions });
});

module.exports = router;
