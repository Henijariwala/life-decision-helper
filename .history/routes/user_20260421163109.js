// routes/user.js
const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/auth");
const admin = require("../firebaseAdmin");

// Test Firebase connection on startup
console.log('🧪 Testing Firebase connection...');
try {
  const db = admin.firestore();
  console.log('✅ Firestore accessible from routes');
} catch (error) {
  console.error('❌ Cannot access Firestore:', error.message);
}

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// Helper to sanitize email
function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') {
    throw new Error('Invalid email');
  }
  return email.trim().toLowerCase();
}

// HOME PAGE
router.get("/", (req, res) => {
  res.render("index");
});

// SIGNUP PAGE
router.get("/Signup", (req, res) => {
  res.render("Signup");
});

// CHAT PAGE - GET
router.get("/chat", requireAuth, async (req, res) => {
  try {
    const db = admin.firestore();
    const chatId = req.query.chatId || "";
    
    console.log("📖 Loading chat page for user:", req.user.email);
    
    let messages = [];
    let currentChatId = chatId;

    if (chatId && chatId.trim() !== "") {
      try {
        const userEmail = sanitizeEmail(req.user.email);
        
        console.log("🔍 Fetching chat:", chatId, "for user:", userEmail);
        
        const chatDoc = await db
          .collection("users")
          .doc(userEmail)
          .collection("chats")
          .doc(chatId)
          .get();

        if (chatDoc.exists) {
          const data = chatDoc.data();
          messages = data.messages || [];
          console.log(`✅ Loaded ${messages.length} messages`);
        } else {
          console.log("⚠️ Chat not found");
          currentChatId = "";
        }
      } catch (err) {
        console.error("❌ Error loading chat:", err);
        currentChatId = "";
      }
    }

    res.render("chat", { messages, chatId: currentChatId });
  } catch (error) {
    console.error("❌ Page load error:", error);
    res.render("chat", { messages: [], chatId: "" });
  }
});

// CHAT PAGE - POST
router.post("/chat", requireAuth, async (req, res) => {
  console.log("\n==========================================");
  console.log("📨 NEW MESSAGE REQUEST");
  console.log("==========================================");
  
  const db = admin.firestore();
  const { message, messages = "[]", chatId = "" } = req.body;
  
  console.log("👤 User:", req.user.email);
  console.log("💬 Message:", message);
  console.log("🆔 Chat ID:", chatId || "NEW CHAT");
  
  // Validate message
  if (!message || typeof message !== 'string' || message.trim() === '') {
    console.error("❌ Empty message");
    let chatMessages = [];
    try {
      chatMessages = JSON.parse(messages);
    } catch (e) {
      chatMessages = [];
    }
    return res.render("chat", { messages: chatMessages, chatId });
  }

  // Parse messages
  let chatMessages = [];
  try {
    chatMessages = JSON.parse(messages);
    if (!Array.isArray(chatMessages)) chatMessages = [];
    console.log("📚 Previous messages:", chatMessages.length);
  } catch (error) {
    console.error("❌ Parse error:", error.message);
    chatMessages = [];
  }

  // Create timestamp (IST)
  const timestamp = new Date().toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });

  // Add user message
  const userMessage = { 
    role: "user", 
    text: message.trim(),
    timestamp: timestamp
  };
  
  chatMessages.push(userMessage);
  console.log("➕ Added user message. Total messages:", chatMessages.length);

  // Save to Firebase
  let currentChatId = chatId;
  
  try {
    const userEmail = sanitizeEmail(req.user.email);
    console.log("📧 Sanitized email:", userEmail);
    
    const userRef = db.collection("users").doc(userEmail);
    const chatData = {
      messages: chatMessages,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastMessage: message.trim(),
      messageCount: chatMessages.length,
      userId: userEmail
    };
    
    if (currentChatId && currentChatId.trim() !== "") {
      // Update existing chat
      console.log("🔄 Updating chat:", currentChatId);
      
      await userRef
        .collection("chats")
        .doc(currentChatId)
        .set(chatData, { merge: true });
      
      console.log("✅ CHAT UPDATED SUCCESSFULLY");
    } else {
      // Create new chat
      console.log("➕ Creating new chat...");
      
      chatData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      
      const newChatRef = await userRef
        .collection("chats")
        .add(chatData);
      
      currentChatId = newChatRef.id;
      console.log("✅ NEW CHAT CREATED:", currentChatId);
    }
    
    // Verify save
    console.log("🔍 Verifying save...");
    const verifyDoc = await userRef.collection("chats").doc(currentChatId).get();
    if (verifyDoc.exists) {
      console.log("✅ VERIFIED: Chat exists in Firebase");
      const savedData = verifyDoc.data();
      console.log("📊 Messages saved:", savedData.messages ? savedData.messages.length : 0);
    } else {
      console.error("❌ VERIFICATION FAILED: Chat not found after save");
    }
    
  } catch (error) {
    console.error("❌ FIREBASE SAVE ERROR:");
    console.error("   Message:", error.message);
    console.error("   Code:", error.code);
    console.error("   Stack:", error.stack);
  }

  // Get AI Response
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    console.log("🤖 Requesting AI response...");

    const conversationHistory = chatMessages
      .filter(msg => msg.text && msg.text.trim() !== '')
      .map(msg => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.text.trim()
      }));

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
            content: "You are a supportive decision-making coach. Keep responses brief (2-3 sentences)."
          },
          ...conversationHistory
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "AI request failed");
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || "I couldn't respond.";
    
    console.log("✅ AI response received");

    const botMessage = { 
      role: "assistant", 
      text: reply.trim(),
      timestamp: new Date().toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      })
    };
    
    chatMessages.push(botMessage);
    console.log("➕ Added AI message. Total messages:", chatMessages.length);

    // Save AI response
    if (currentChatId) {
      try {
        const userEmail = sanitizeEmail(req.user.email);
        
        await db
          .collection("users")
          .doc(userEmail)
          .collection("chats")
          .doc(currentChatId)
          .set({
            messages: chatMessages,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastMessage: reply.trim(),
            messageCount: chatMessages.length
          }, { merge: true });
        
        console.log("✅ AI MESSAGE SAVED");
      } catch (error) {
        console.error("❌ Error saving AI message:", error.message);
      }
    }

  } catch (error) {
    console.error("❌ AI ERROR:", error.message);

    const errorMessage = {
      role: "assistant",
      text: `⚠️ ${error.message}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      }),
      isError: true
    };
    
    chatMessages.push(errorMessage);
  }

  console.log("==========================================\n");
  res.render("chat", { messages: chatMessages, chatId: currentChatId });
});

// HISTORY PAGE
router.get("/history", requireAuth, async (req, res) => {
  try {
    const db = admin.firestore();
    const userEmail = sanitizeEmail(req.user.email);

    console.log("📚 Loading history for:", userEmail);

    const chatsSnap = await db
      .collection("users")
      .doc(userEmail)
      .collection("chats")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    console.log("📊 Found", chatsSnap.docs.length, "chats");

    const decisions = chatsSnap.docs.map(doc => {
      const data = doc.data();
      
      return {
        id: doc.id,
        messages: data.messages || [],
        createdAt: data.createdAt ? data.createdAt.toDate() : null,
        preview: data.messages?.[0]?.text?.substring(0, 150) || "Empty chat",
        messageCount: data.messageCount || 0
      };
    });

    res.render("history", { decisions });
  } catch (error) {
    console.error("❌ History error:", error.message);
    res.render("history", { decisions: [] });
  }
});

// DELETE CHAT
router.delete("/chat/:chatId", requireAuth, async (req, res) => {
  try {
    const db = admin.firestore();
    const userEmail = sanitizeEmail(req.user.email);

    console.log("🗑️ Deleting chat:", req.params.chatId);

    await db
      .collection("users")
      .doc(userEmail)
      .collection("chats")
      .doc(req.params.chatId)
      .delete();

    console.log("✅ Deleted");
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Delete error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// LOGOUT
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

// ─────────────────────────────────────────────
//  PROFILE
// ─────────────────────────────────────────────

// GET /profile
router.get("/profile", requireAuth, async (req, res) => {
  try {
    const db = admin.firestore();
    const userEmail = sanitizeEmail(req.user.email);

    const profileSnap = await db
      .collection("users")
      .doc(userEmail)
      .collection("profile")
      .doc("data")
      .get();

    const profile = profileSnap.exists ? profileSnap.data() : {};

    const chatsSnap = await db
      .collection("users")
      .doc(userEmail)
      .collection("chats")
      .get();

    const totalChats = chatsSnap.size;
    const totalMessages = chatsSnap.docs.reduce((acc, doc) => {
      return acc + ((doc.data().messages && doc.data().messages.length) || 0);
    }, 0);

    res.render("profile", {
      email:          userEmail,
      name:           profile.name      || "",
      bio:            profile.bio       || "",
      createdAt:      profile.createdAt || null,
      updatedAt:      profile.updatedAt || null,
      totalChats,
      totalMessages,
      successMessage: req.query.saved === "1" ? "Profile saved successfully!" : null,
      errorMessage:   null,
    });
  } catch (err) {
    console.error("❌ PROFILE GET ERROR:", err.message);
    res.status(500).send("Failed to load profile.");
  }
});

// POST /profile/update
router.post("/profile/update", requireAuth, async (req, res) => {
  const db        = admin.firestore();
  const userEmail = sanitizeEmail(req.user.email);
  const name      = (req.body.name || "").trim();
  const bio       = (req.body.bio  || "").trim();

  // Validation — re-render with error so the user doesn't lose their input
  if (!name || name.length < 2) {
    try {
      const chatsSnap = await db
        .collection("users")
        .doc(userEmail)
        .collection("chats")
        .get();

      return res.render("profile", {
        email:          userEmail,
        name,
        bio,
        createdAt:      null,
        updatedAt:      null,
        totalChats:     chatsSnap.size,
        totalMessages:  chatsSnap.docs.reduce(
          (acc, doc) => acc + ((doc.data().messages?.length) || 0), 0
        ),
        successMessage: null,
        errorMessage:   "Name must be at least 2 characters.",
      });
    } catch (e) {
      return res.status(500).send("Validation failed.");
    }
  }

  try {
    const ref = db
      .collection("users")
      .doc(userEmail)
      .collection("profile")
      .doc("data");

    const existing = await ref.get();

    await ref.set(
      {
        name,
        bio,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...(!existing.exists && {
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }),
      },
      { merge: true }
    );

    console.log("✅ Profile saved for:", userEmail);
    res.redirect("/profile?saved=1");
  } catch (err) {
    console.error("❌ PROFILE UPDATE ERROR:", err.message);
    res.status(500).send("Failed to save profile.");
  }
});

module.exports = router;