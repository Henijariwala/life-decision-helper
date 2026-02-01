const express = require("express");
const router = express.Router();

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

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
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set in environment variables");
    }

    console.log("🔄 Sending request to OpenAI API...");

    // Build conversation history for OpenAI
    const conversationHistory = chatMessages.map(msg => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.text
    }));

    // Call OpenAI API
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // or "gpt-4o" for GPT-4, or "gpt-3.5-turbo" for cheaper option
        messages: [
          {
            role: "system",
            content: "You are a wise and helpful decision-making assistant. Provide practical, thoughtful, and friendly advice to help users make better decisions."
          },
          ...conversationHistory
        ],
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 0.95
      })
    });

    // Check response status
    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ OpenAI API Error:", JSON.stringify(errorData, null, 2));
      
      let errorMessage = "Unknown error";
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
      
      throw new Error(`API Error: ${response.status} - ${errorMessage}`);
    }

    const data = await response.json();
    console.log("✅ OpenAI Response Received");

    // Extract AI response
    const reply =
      data?.choices?.[0]?.message?.content ||
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