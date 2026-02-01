const express = require("express");
const router = express.Router();

// ✅ fetch fix
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent";

// GET chat page
router.get("/chat", (req, res) => {
  res.render("chat", { messages: [] });
});

// POST chat
router.post("/chat", async (req, res) => {
  const { message, messages = "[]" } = req.body;

  let chatMessages = [];
  try {
    chatMessages = JSON.parse(messages);
  } catch {
    chatMessages = [];
  }

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
    console.log("🟢 GEMINI RAW:", JSON.stringify(data, null, 2));

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "🤖 Gemini did not return a response.";

    chatMessages.push({ role: "Bot", text: reply });

    // ✅ FIXED render
    res.render("chat", { messages: chatMessages });

  } catch (err) {
    console.error("🔴 GEMINI ERROR:", err.message);

    chatMessages.push({
      role: "Bot",
      text: "⚠️ Gemini service error. Please try again."
    });

    res.render("chat", { messages: chatMessages });
  }
});

module.exports = router;
