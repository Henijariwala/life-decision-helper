const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-pro" // ✅ WORKING MODEL
});

// Home
router.get("/", (req, res) => {
  res.render("index");
});

// Chat page
router.get("/chat", (req, res) => {
  res.render("chat", { messages: [] });
});

// Chat submit
router.post("/chat", async (req, res) => {
  const { message, messages = "[]" } = req.body;
  let chatMessages = JSON.parse(messages);

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

    res.render("chat", { messages: chatMessages });

  } catch (err) {
    console.error("GEMINI ERROR:", err);

    chatMessages.push({
      role: "Bot",
      text: "⚠️ AI is temporarily unavailable. Please try again."
    });

    res.render("chat", { messages: chatMessages });
  }
});

module.exports = router;
