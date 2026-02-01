const express = require("express");
const OpenAI = require("openai");
const requireAuth = require("../middleware/auth");
const saveChat = require("../utils/saveChat");

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are a helpful, intelligent assistant.
Answer clearly and directly to any question the user asks.
`;

// Home
router.get("/", (req, res) => res.render("index"));
router.get("/signup", (req, res) => res.render("signup"));

// Chat page
router.get("/chat", requireAuth, (req, res) => {
  res.render("chat", {
    messages: [],
    step: "CHAT"
  });
});

// Chat submit
router.post("/chat", requireAuth, async (req, res) => {
  const { message, messages = "[]" } = req.body;
  let chatMessages = JSON.parse(messages);

  chatMessages.push({
    role: "user",
    text: message,
    createdAt: Date.now()
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...chatMessages.map(m => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.text
        }))
      ]
    });

    const reply = completion.choices[0].message.content;

    chatMessages.push({
      role: "bot",
      text: reply,
      createdAt: Date.now()
    });

    await saveChat({
      email: req.user.email,
      messages: chatMessages
    });

    res.render("chat", {
      messages: chatMessages,
      step: "CHAT"
    });

  } catch (err) {
    console.error("OPENAI ERROR:", err);

    chatMessages.push({
      role: "bot",
      text: "⚠️ AI is temporarily unavailable. Please try again later.",
      createdAt: Date.now()
    });

    res.render("chat", {
      messages: chatMessages,
      step: "CHAT"
    });
  }
});

module.exports = router;
