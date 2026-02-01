const express = require("express");
const fetch = require("node-fetch"); // ✅ REQUIRED
const router = express.Router();

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// HOME
router.get("/", (req, res) => {
  res.render("index");
});

// CHAT PAGE
router.get("/chat", (req, res) => {
  res.render("chat", { messages: [] });
});

// CHAT WITH AI ✅
router.post("/chat", async (req, res) => {
  const { message } = req.body;

  const messages = [
    { role: "User", text: message }
  ];

  try {
    const response = await fetch(
      `${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `You are a wise decision-making assistant.
Give helpful, practical, and friendly advice.

User question:
${message}`
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    console.log("GEMINI RESPONSE:", JSON.stringify(data, null, 2));

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "🤖 I couldn’t generate a response.";

    messages.push({ role: "Bot", text: reply });

  } catch (err) {
    console.error("GEMINI ERROR:", err);
    messages.push({
      role: "Bot",
      text: "⚠️ AI error. Check API key or server configuration."
    });
  }

  res.render("chat", { messages });
});

module.exports = router;
