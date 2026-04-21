const express = require("express");
const admin = require("../firebaseAdmin");
const requireAuth = require("../middleware/auth"); // ← default export, matches your auth.js

const router = express.Router();

// Same sanitizeEmail you use everywhere
function sanitizeEmail(email) {
  if (!email || typeof email !== "string") throw new Error("Invalid email");
  return email.trim().toLowerCase();
}

// ── GET /profile ──────────────────────────────────────────────
router.get("/", requireAuth, async (req, res) => {
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
      const data = doc.data();
      return acc + ((data.messages && data.messages.length) || 0);
    }, 0);

    res.render("profile", {
      email: userEmail,
      name: profile.name || "",
      bio: profile.bio || "",
      createdAt: profile.createdAt || null,
      totalChats,
      totalMessages,
      successMessage: req.query.saved === "1" ? "Profile saved successfully!" : null,
      errorMessage: null,
    });
  } catch (err) {
    console.error("❌ PROFILE GET ERROR:", err.message);
    res.status(500).send("Failed to load profile.");
  }
});

// ── POST /profile/update ──────────────────────────────────────
router.post("/update", requireAuth, async (req, res) => {
  const userEmail = sanitizeEmail(req.user.email);
  const name = (req.body.name || "").trim();
  const bio = (req.body.bio || "").trim();

  // Validation — re-render with error so user doesn't lose input
  if (!name || name.length < 2) {
    try {
      const db = admin.firestore();
      const chatsSnap = await db
        .collection("users")
        .doc(userEmail)
        .collection("chats")
        .get();

      return res.render("profile", {
        email: userEmail,
        name,
        bio,
        createdAt: null,
        totalChats: chatsSnap.size,
        totalMessages: chatsSnap.docs.reduce(
          (acc, doc) => acc + ((doc.data().messages?.length) || 0), 0
        ),
        successMessage: null,
        errorMessage: "Name must be at least 2 characters.",
      });
    } catch (e) {
      return res.status(500).send("Validation failed.");
    }
  }

  try {
    const db = admin.firestore();
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