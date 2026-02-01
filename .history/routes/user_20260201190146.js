const express = require("express");

const router = express.Router();

// Gemini REST endpoint (stable)
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

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
  const chatMessages = JSON.parse(messages);

  chatMessages.push({
    role: "User",
    text: message
  });

  try {
    // ✅ Use GLOBAL fetch (Node 18+)
    const response = await fetch(
      `${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: message }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚠️ No response from AI.";

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
