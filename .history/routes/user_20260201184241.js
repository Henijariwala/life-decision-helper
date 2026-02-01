const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const requireAuth = require("../middleware/auth");

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Home
router.get("/", (req, res) => res.render("index"));
router.get("/signup", (req, res) => res.render("signup"));

// Chat page
router.get("/chat", requireAuth, (req, res) => {
  res.render("chat", {
    messages: []
  });
});

// Chat submit
router.post("/chat", requireAuth, async (req, res) => {
  const { message, messages = "[]" } = req.body;
  let chatMessages = JSON.parse(messages);

  chatMessages.push({
    role: "user",
    text: message
  });

  try {
    const result = await model.generateContent(message);
    const reply = result.response.text();

    chatMessages.push({
      role: "bot",
      text: reply
    });

    res.render("chat", {
      messages: chatMessages
    });

  } catch (err) {
    console.error("GEMINI ERROR:", err);

    chatMessages.push({
      role: "bot",
      text: "⚠️ AI is temporarily unavailable. Please try again."
    });

    res.render("chat", {
      messages: chatMessages
    });
  }
});

module.exports = router;
