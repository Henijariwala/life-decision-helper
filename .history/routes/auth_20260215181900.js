// routes/auth.js - Authentication Routes
const express = require("express");
const router = express.Router();

// HOME / LOGIN PAGE
router.get("/", (req, res) => {
  // If already logged in, redirect to chat
  if (req.cookies.token) {
    return res.redirect("/chat");
  }
  
  res.render("index", {
    error: req.query.error || null
  });
});

// SIGNUP PAGE
router.get("/signup", (req, res) => {
  if (req.cookies.token) {
    return res.redirect("/chat");
  }
  
  res.render("signup");
});

// LOGOUT
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

module.exports = router;