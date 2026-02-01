const express = require("express");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const router = express.Router();

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent";

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
      `${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    console.log("🟢 GEMINI RAW RESPONSE:", JSON.stringify(data, null, 2));

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "🤖 Gemini did not return a response. Please try again.";

    chatMessages.push({ role: "Bot", text: reply });

    res.render("chat", { messages: chatMessages });

  } catch (error) {
    console.error("🔴 GEMINI ERROR:", error);

    chatMessages.push({
      role: "Bot",
      text: "⚠️ Gemini service error. Please try again later."
    });

    res.render("chat", { messages: chatMessages });
  }
});

module.exports = router;
