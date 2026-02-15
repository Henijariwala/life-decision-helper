// routes/admin.js - Admin/History Routes
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const FirebaseService = require("../services/firebaseService");

// GET /admin - View chat history
router.get("/", requireAuth, async (req, res) => {
  try {
    const chats = await FirebaseService.getUserChats(req.user.email);
    
    res.render("admin", {
      title: "Chat History",
      chats: chats,
      user: req.user
    });
  } catch (error) {
    console.error("❌ Admin error:", error);
    res.render("admin", {
      title: "Chat History",
      chats: [],
      user: req.user
    });
  }
});

module.exports = router;