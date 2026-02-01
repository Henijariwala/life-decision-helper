const express = require("express");
const router = express.Router();

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// HOME PAGE
router.get("/", (req, res) => {
  res.render("index");
});

// CHAT PAGE - GET
router.get("/chat", (req, res) => {
  res.render("chat", { messages: [] });
});

// CHAT PAGE - POST (Handle message submission)
router.post("/chat", async (req, res) => {
  // Get the new message and previous messages
  const { message, messages = "[]" } = req.body;
  
  // Parse previous messages
  let chatMessages = [];
  try {
    chatMessages = JSON.parse(messages);
  } catch (error) {
    console.error("Error parsing messages:", error);
    chatMessages = [];
  }

  // Add user message
  chatMessages.push({ 
    role: "user", 
    text: message,
    timestamp: new Date().toLocaleTimeString()
  });

  try {
    // Check if API key exists
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }

    console.log("🔄 Sending request to Gemini API...");

    // Call Gemini API
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
                  text: `You are a wise and helpful decision-making assistant. 
Provide practical, thoughtful, and friendly advice to help users make better decisions.

User question:
${message}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    // Check response status
    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Gemini API Error:", JSON.stringify(errorData, null, 2));
      throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log("✅ Gemini Response Received");

    // Extract AI response
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "🤖 I couldn't generate a response. Please try again.";

    // Add bot message
    chatMessages.push({ 
      role: "assistant", 
      text: reply,
      timestamp: new Date().toLocaleTimeString()
    });

    console.log("✅ Chat updated successfully");

  } catch (error) {
    console.error("❌ ERROR:", error.message);

    // Add error message
    chatMessages.push({
      role: "assistant",
      text: `⚠️ AI error. ${error.message}`,
      timestamp: new Date().toLocaleTimeString(),
      isError: true
    });
  }

  // Render chat page with updated messages
  res.render("chat", { messages: chatMessages });
});

module.exports = router;