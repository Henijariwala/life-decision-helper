// routes/user.js — OPTIMIZED (no verify read, single Firebase write per turn)
const express = require("express");
const router  = express.Router();
const requireAuth = require("../middleware/auth");
const admin = require("../firebaseAdmin");

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

function sanitizeEmail(email) {
  if (!email || typeof email !== "string") throw new Error("Invalid email");
  return email.trim().toLowerCase();
}

// ─── HOME ───────────────────────────────────────────────
router.get("/", (req, res) => res.render("index"));

// ─── SIGNUP PAGE ────────────────────────────────────────
router.get("/Signup", (req, res) => res.render("Signup"));

// ─── CHAT GET ───────────────────────────────────────────
router.get("/chat", requireAuth, async (req, res) => {
  try {
    const db         = admin.firestore();
    const chatId     = req.query.chatId || "";
    let   messages   = [];
    let   currentId  = chatId;

    if (chatId.trim()) {
      const doc = await db
        .collection("users")
        .doc(sanitizeEmail(req.user.email))
        .collection("chats")
        .doc(chatId)
        .get();

      if (doc.exists) {
        messages = doc.data().messages || [];
      } else {
        currentId = "";
      }
    }

    res.render("chat", { messages, chatId: currentId });
  } catch (err) {
    console.error("Chat GET error:", err.message);
    res.render("chat", { messages: [], chatId: "" });
  }
});

// ─── CHAT POST ──────────────────────────────────────────
router.post("/chat", requireAuth, async (req, res) => {
  const db = admin.firestore();
  const { message, messages = "[]", chatId = "" } = req.body;

  // ── 1. Parse history ──────────────────────────────────
  let history = [];
  try {
    history = JSON.parse(messages);
    if (!Array.isArray(history)) history = [];
  } catch (_) {
    history = [];
  }

  if (!message || !message.trim()) {
    return res.render("chat", { messages: history, chatId });
  }

  const stamp = () =>
    new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit", hour12: true,
      timeZone: "Asia/Kolkata",
    });

  // ── 2. Add user message ───────────────────────────────
  history.push({ role: "user", text: message.trim(), timestamp: stamp() });

  // ── 3. Call OpenAI ────────────────────────────────────
  let reply       = "";
  let isError     = false;

  try {
    if (!process.env.OPENAI_API_KEY) throw new Error("OpenAI API key not configured");

    const aiRes = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a supportive decision-making coach. Keep responses concise (2–3 sentences max).",
          },
          ...history
            .filter(m => m.text && m.text.trim())
            .map(m => ({
              role:    m.role === "assistant" ? "assistant" : "user",
              content: m.text.trim(),
            })),
        ],
        temperature: 0.7,
        max_tokens:  150,   // ← caps response length → faster
      }),
    });

    if (!aiRes.ok) {
      const err = await aiRes.json();
      throw new Error(err.error?.message || "OpenAI request failed");
    }

    const data = await aiRes.json();
    reply = data?.choices?.[0]?.message?.content?.trim() || "I couldn't respond.";
  } catch (err) {
    console.error("OpenAI error:", err.message);
    reply   = `⚠️ ${err.message}`;
    isError = true;
  }

  // ── 4. Add AI reply ───────────────────────────────────
  history.push({ role: "assistant", text: reply, timestamp: stamp(), isError });

  // ── 5. ONE single Firebase write (no verify read) ─────
  try {
    const userEmail = sanitizeEmail(req.user.email);
    const chatRef   = db.collection("users").doc(userEmail).collection("chats");

    if (chatId.trim()) {
      // Update existing chat
      await chatRef.doc(chatId).set(
        {
          messages:     history,
          lastMessage:  reply,
          messageCount: history.length,
          updatedAt:    admin.firestore.FieldValue.serverTimestamp(),
          userId:       userEmail,
        },
        { merge: true }
      );
      return res.render("chat", { messages: history, chatId });
    } else {
      // Create new chat
      const newRef = await chatRef.add({
        messages:     history,
        lastMessage:  reply,
        messageCount: history.length,
        createdAt:    admin.firestore.FieldValue.serverTimestamp(),
        updatedAt:    admin.firestore.FieldValue.serverTimestamp(),
        userId:       userEmail,
      });
      return res.render("chat", { messages: history, chatId: newRef.id });
    }
  } catch (err) {
    console.error("Firebase write error:", err.message);
    // Still return the chat even if save failed
    return res.render("chat", { messages: history, chatId });
  }
});

// ─── HISTORY ────────────────────────────────────────────
router.get("/history", requireAuth, async (req, res) => {
  try {
    const db        = admin.firestore();
    const userEmail = sanitizeEmail(req.user.email);

    const snap = await db
      .collection("users")
      .doc(userEmail)
      .collection("chats")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const decisions = snap.docs.map(doc => {
      const d = doc.data();
      return {
        id:           doc.id,
        messages:     d.messages || [],
        createdAt:    d.createdAt ? d.createdAt.toDate() : null,
        preview:      d.messages?.[0]?.text?.substring(0, 150) || "Empty chat",
        messageCount: d.messageCount || 0,
      };
    });

    res.render("history", { decisions });
  } catch (err) {
    console.error("History error:", err.message);
    res.render("history", { decisions: [] });
  }
});

// ─── DELETE CHAT ────────────────────────────────────────
router.delete("/chat/:chatId", requireAuth, async (req, res) => {
  try {
    const db        = admin.firestore();
    const userEmail = sanitizeEmail(req.user.email);

    await db
      .collection("users")
      .doc(userEmail)
      .collection("chats")
      .doc(req.params.chatId)
      .delete();

    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── LOGOUT ─────────────────────────────────────────────
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

module.exports = router;