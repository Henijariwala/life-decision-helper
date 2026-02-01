const express = require("express");
const router = express.Router();

// HOME PAGE
router.get("/", (req, res) => {
  res.render("home");
});

// CHAT PAGE (THIS FIXES Cannot GET /chat)
router.get("/chat", (req, res) => {
  res.render("chat", { messages: [] });
});

// CHAT FORM SUBMIT (for now just echo)
router.post("/chat", (req, res) => {
  const { message } = req.body;

  const messages = [
    { role: "User", text: message },
    { role: "Bot", text: "✅ Chat route is working. Gemini will be added next." }
  ];

  res.render("chat", { messages });
});

module.exports = router;
