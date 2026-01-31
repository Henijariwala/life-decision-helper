const express = require("express");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.get("/", (req, res) => {
  res.render("index");
});

router.get("/chat", requireAuth, (req, res) => {
  res.render("chat", { messages: [], step: "START" });
});

router.post("/chat", requireAuth, async (req, res) => {
  const { message, messages = "[]" } = req.body;
  let chatMessages = JSON.parse(messages);

  chatMessages.push({ role: "User", text: message });

  // 🔒 SAFE FALLBACK (no quota crash)
  const reply =
    "🤖 I'm here to help! AI replies are currently limited, but your message was saved.";

  chatMessages.push({ role: "Bot", text: reply });

  res.render("chat", {
    messages: chatMessages,
    step: "CONTINUE"
  });
});

router.get("/history", requireAuth, (req, res) => {
  res.render("history", { decisions: [] });
});

module.exports = router;
