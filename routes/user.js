const express = require("express");
const router = express.Router();

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent";

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

  chatMessages.push({ role: "User", text: message });

  try {
    const response = await fetch(
      `${GEMINI_ENDPOINT}?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: message }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300
          }
        })
      }
    );

    const data = await response.json();
    console.log("🟢 GEMINI RESPONSE:", JSON.stringify(data, null, 2));

    let reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      reply = "🤖 Gemini did not return a response. Please try another question.";
    }

    chatMessages.push({ role: "Bot", text: reply });

    res.render("chat", { messages: chatMessages });

  } catch (error) {
    console.error("🔴 GEMINI ERROR:", error);

    chatMessages.push({
      role: "Bot",
      text: "⚠️ AI service error. Please try again later."
    });

    res.render("chat", { messages: chatMessages });
  }
});

module.exports = router;
