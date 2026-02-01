const express = require("express");
const router = express.Router();

// HOME
router.get("/", (req, res) => {
  res.render("index");
});

// CHAT PAGE
router.get("/chat", (req, res) => {
  res.render("chat", { messages: [] });
});

// CHAT POST
router.post("/chat", (req, res) => {
  const { message } = req.body;

  const messages = [
    { role: "User", text: message },
    { role: "Bot", text: "✅ Chat route is working. Gemini will be added next." }
  ];

  res.render("chat", { messages });
});

module.exports = router;
