const express = require("express");
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

// CHAT WITH AI (Decision Maker Mode) ✅
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
                  text: `
You are a wise and friendly decision-making assistant.
Your job is to help users make better decisions in life, career, health, relationships,
and daily choices.

Always:
- Give clear, practical, and thoughtful advice
- Explain pros and cons when needed
- Be supportive and respectful
- Help the user think, not judge them

User question:
${message}
`
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "🤖 I couldn’t generate a response right now. Please try again.";

    messages.push({ role: "Bot", text: reply });

  } catch (err) {
    console.error(err);
    messages.push({
      role: "Bot",
      text: "⚠️ I had trouble responding. Please try again later."
    });
  }

  res.render("chat", { messages });
});

module.exports = router;
