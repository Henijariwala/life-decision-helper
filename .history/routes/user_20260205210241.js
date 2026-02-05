//routes/user.js
const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const admin = require("../firebaseAdmin");

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// HOME PAGE (Login)
router.get("/", (req, res) => {
  res.render("index");
});

// SIGNUP PAGE
router.get("/Signup", (req, res) => {
  res.render("Signup");
});

// CHAT PAGE - GET (Protected Route)
router.get("/chat", requireAuth, async (req, res) => {
  try {
    const db = admin.firestore();
    const chatId = req.query.chatId || "";
    
    let messages = [];
    let currentChatId = chatId;

    // If chatId is provided, load existing chat
    if (chatId) {
      try {
        const chatDoc = await db
          .collection("users")
          .doc(req.user.email)
          .collection("chats")
          .doc(chatId)
          .get();

        if (chatDoc.exists) {
          const data = chatDoc.data();
          messages = data.messages || [];
        } else {
          console.log("Chat not found, starting new chat");
          currentChatId = "";
        }
      } catch (err) {
        console.error("Error loading chat:", err);
        currentChatId = "";
      }
    }

    res.render("chat", { messages, chatId: currentChatId });
  } catch (error) {
    console.error("Error loading chat page:", error);
    res.render("chat", { messages: [], chatId: "" });
  }
});

// CHAT PAGE - POST (Handle message submission)
router.post("/chat", requireAuth, async (req, res) => {
  const db = admin.firestore();
  const { message, messages = "[]", chatId = "" } = req.body;
  
  // Parse previous messages
  let chatMessages = [];
  try {
    chatMessages = JSON.parse(messages);
  } catch (error) {
    console.error("Error parsing messages:", error);
    chatMessages = [];
  }

  // Add user message
  const userMessage = { 
    role: "user", 
    text: message,
    timestamp: new Date().toLocaleTimeString()
  };
  
  chatMessages.push(userMessage);

  // Save user message to Firebase immediately
  let currentChatId = chatId;
  try {
    if (currentChatId) {
      // Update existing chat
      await db
        .collection("users")
        .doc(req.user.email)
        .collection("chats")
        .doc(currentChatId)
        .update({
          messages: chatMessages,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      console.log("✅ Updated existing chat:", currentChatId);
    } else {
      // Create new chat
      const newChatRef = await db
        .collection("users")
        .doc(req.user.email)
        .collection("chats")
        .add({
          messages: chatMessages,
          step: "EMOTIONAL",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      currentChatId = newChatRef.id;
      console.log("✅ Created new chat:", currentChatId);
    }
  } catch (error) {
    console.error("❌ Error saving user message to Firebase:", error);
  }

  // Get AI Response
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

    // Call OpenAI API with UPDATED SYSTEM PROMPT
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a supportive and insightful decision-making coach. Follow these guidelines strictly:

1. BREVITY: Keep ALL responses to 2-3 sentences maximum. Be concise and impactful.

2. ENCOURAGEMENT: When the user is making good decisions or thinking clearly:
   - Acknowledge their wisdom and good judgment
   - Celebrate their positive thinking
   - Reinforce their strengths
   - Examples: "That's excellent thinking! You're considering all the right factors." or "I love how you're approaching this thoughtfully."

3. GENTLE GUIDANCE: When the user seems to be going in a problematic direction:
   - Gently point out potential concerns without being harsh
   - Ask thoughtful questions to help them reconsider
   - Suggest alternative perspectives kindly
   - Examples: "I hear you, but have you considered how this might affect your long-term goals?" or "That path might be challenging - what if we explored some other options?"

4. TONE: Always be warm, supportive, and non-judgmental. You're a caring friend who wants the best for them.

5. FORMAT: Never use bullet points or lists. Speak naturally in 2-3 complete sentences.

Remember: Brief, encouraging, and helpful. That's your mission.`
          },
          ...conversationHistory
        ],
        temperature: 0.7,
        max_tokens: 150, // Reduced to enforce brevity
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
    const botMessage = { 
      role: "assistant", 
      text: reply,
      timestamp: new Date().toLocaleTimeString()
    };
    
    chatMessages.push(botMessage);

    // Save bot message to Firebase
    try {
      await db
        .collection("users")
        .doc(req.user.email)
        .collection("chats")
        .doc(currentChatId)
        .update({
          messages: chatMessages,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      
      console.log("✅ Bot message saved to Firebase");
    } catch (error) {
      console.error("❌ Error saving bot message to Firebase:", error);
    }

  } catch (error) {
    console.error("❌ AI ERROR:", error.message);

    // Add error message
    const errorMessage = {
      role: "assistant",
      text: `⚠️ AI error: ${error.message}`,
      timestamp: new Date().toLocaleTimeString(),
      isError: true
    };
    
    chatMessages.push(errorMessage);

    // Save error message to Firebase
    if (currentChatId) {
      try {
        await db
          .collection("users")
          .doc(req.user.email)
          .collection("chats")
          .doc(currentChatId)
          .update({
            messages: chatMessages,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
      } catch (fbError) {
        console.error("❌ Error saving error message to Firebase:", fbError);
      }
    }
  }

  // Render chat page with updated messages
  res.render("chat", { messages: chatMessages, chatId: currentChatId });
});

// HISTORY PAGE - View all past chats
router.get("/history", requireAuth, async (req, res) => {
  try {
    const db = admin.firestore();

    const chatsSnap = await db
      .collection("users")
      .doc(req.user.email)
      .collection("chats")
      .orderBy("createdAt", "desc")
      .get();

    const decisions = chatsSnap.docs.map(doc => {
      const data = doc.data();
      
      // Convert Firestore timestamp to JavaScript date
      let createdAtDate = null;
      if (data.createdAt) {
        createdAtDate = data.createdAt.toDate();
      }
      
      return {
        id: doc.id,
        messages: data.messages || [],
        step: data.step,
        createdAt: createdAtDate,
        preview: data.messages && data.messages.length > 0 
          ? data.messages[0].text.substring(0, 100) + "..."
          : "No messages"
      };
    });

    res.render("history", { decisions });
  } catch (error) {
    console.error("HISTORY ERROR:", error);
    res.status(500).send("Failed to load history: " + error.message);
  }
});

// DELETE CHAT
router.delete("/chat/:chatId", requireAuth, async (req, res) => {
  try {
    const db = admin.firestore();
    const chatId = req.params.chatId;

    await db
      .collection("users")
      .doc(req.user.email)
      .collection("chats")
      .doc(chatId)
      .delete();

    res.json({ success: true, message: "Chat deleted successfully" });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// LOGOUT
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

module.exports = router;