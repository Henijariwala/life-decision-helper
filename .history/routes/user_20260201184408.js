const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const requireAuth = require("../middleware/auth");

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash"
});

// Home
router.get("/", (req, res) => {
  res.render("index");
});

router.get("/Signup", (req, res) => {
  res.render("Signup");
});

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

  // Save user message
  chatMessages.push({
    role: "User",
    text: message
  });

  try {
    const result = await model.generateContent(message);
    const reply = result.response.text();

    chatMessages.push({
      role: "Bot",
      text: reply
    });

    res.render("chat", {
      messages: chatMessages
    });

  } catch (error) {
    console.error("GEMINI ERROR:", error);

    chatMessages.push({
      role: "Bot",
      text: "⚠️ AI is temporarily unavailable. Please try again."
    });

    res.render("chat", {
      messages: chatMessages
    });
  }
});

module.exports = router;
