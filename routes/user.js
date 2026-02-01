const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.render("index");
});

router.get("/chat", (req, res) => {
  res.render("chat", { messages: [] });
});

router.post("/chat", (req, res) => {
  const { message } = req.body;

  const messages = [
    { role: "User", text: message },
    { role: "Bot", text: "✅ Chat route is working." }
  ];

  res.render("chat", { messages });
});

module.exports = router;
