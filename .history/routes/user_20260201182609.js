const express = require("express");
const OpenAI = require("openai");
const requireAuth = require("../middleware/auth");
const saveChat = require("../utils/saveChat");

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPT = `
You are a helpful, intelligent assistant.
Answer clearly and helpfully to ANY question the user asks.
`;

// Home
router.get("/", (req, res) => res.render("index"));
router.get("/signup", (req, res) => res.render("signup"));

// Chat
router.get("/chat", requireAuth, (req, res) => {
  res.render("chat", { messages: [] });
});

router.post("/chat", requireAuth, async (req, res) => {
  const { message, messages = "[]" } = req.body;
  let chatMessages = JSON.parse(messages);

  chatMessages.push({
    role: "user",
    content: message
  });

  try {
    const ai = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...chatMessages
      ]
    });

    const reply = ai.choices[0].message.content;

    chatMessages.push({
      role: "assistant",
      content: reply
    });

    await saveChat({
      email: req.user.email,
      messages: chatMessages,
      step: "CHAT"
    });

    res.render("chat", { messages: chatMessages });

  } catch (err) {
    console.error("OPENAI ERROR:", err);

    res.status(500).send(
      "AI is temporarily unavailable. Please try again."
    );
  }
});

module.exports = router;
