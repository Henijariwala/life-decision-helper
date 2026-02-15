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
  
  console.log("📥 Request body:", req.body);
  
  const { message, messages = "[]", chatId = "" } = req.body;
  
  // CRITICAL FIX: Validate message exists and is not empty
  if (!message || typeof message !== 'string' || message.trim() === '') {
    console.error("❌ Empty or invalid message received");
    console.error("Message value:", message);
    
    // Parse previous messages for rendering
    let chatMessages = [];
    try {
      chatMessages = JSON.parse(messages);
      if (!Array.isArray(chatMessages)) {
        chatMessages = [];
      }
    } catch (error) {
      console.error("Error parsing messages:", error);
      chatMessages = [];
    }
    
    return res.render("chat", { 
      messages: chatMessages, 
      chatId: chatId 
    });
  }

  // Parse previous messages
  let chatMessages = [];
  try {
    chatMessages = JSON.parse(messages);
    if (!Array.isArray(chatMessages)) {
      chatMessages = [];
    }
  } catch (error) {
    console.error("Error parsing messages:", error);
    chatMessages = [];
  }

  // Add user message with validation
  const userMessage = { 
    role: "user", 
    text: message.trim(),
    timestamp: new Date().toLocaleTimeString()
  };
  
  console.log("✅ User message:", userMessage);
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

    // Build conversation history for OpenAI with validation
    const conversationHistory = chatMessages
      .filter(msg => msg.text && typeof msg.text === 'string' && msg.text.trim() !== '')
      .map(msg => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.text.trim()
      }));

    // Ensure we have at least one message
    if (conversationHistory.length === 0) {
      throw new Error("No valid messages to send to OpenAI");
    }

    console.log("📤 Conversation history:", JSON.stringify(conversationHistory, null, 2));

    // Call OpenAI API
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

3. GENTLE GUIDANCE: When the user seems to be going in a problematic direction:
   - Gently point out potential concerns without being harsh
   - Ask thoughtful questions to help them reconsider
   - Suggest alternative perspectives kindly

4. TONE: Always be warm, supportive, and non-judgmental. You're a caring friend who wants the best for them.

5. FORMAT: Never use bullet points or lists. Speak naturally in 2-3 complete sentences.

Remember: Brief, encouraging, and helpful. That's your mission.`
          },
          ...conversationHistory
        ],
        temperature: 0.7,
        max_tokens: 150,
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

    // Extract AI response with validation
    const reply =
      data?.choices?.[0]?.message?.content ||
      "🤖 I couldn't generate a response. Please try again.";

    // Validate reply is not null or empty
    const validReply = (reply && typeof reply === 'string' && reply.trim() !== '') 
      ? reply.trim() 
      : "I'm here to help! Please tell me more.";

    console.log("🤖 AI Reply:", validReply);

    // Add bot message
    const botMessage = { 
      role: "assistant", 
      text: validReply,
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
      text: `⚠️ ${error.message || 'Something went wrong. Please try again.'}`,
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
  console.log("📄 Rendering chat with", chatMessages.length, "messages");
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
      
      // Get preview with null check
      let preview = "Empty chat";
      if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
        const firstMessage = data.messages[0];
        if (firstMessage && firstMessage.text) {
          preview = firstMessage.text.substring(0, 100) + "...";
        }
      }
      
      return {
        id: doc.id,
        messages: data.messages || [],
        step: data.step,
        createdAt: createdAtDate,
        preview: preview
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