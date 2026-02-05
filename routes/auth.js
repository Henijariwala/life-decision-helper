// routes/auth.js - Authentication Routes
const express = require("express");
const router = express.Router();
const { redirectIfAuth } = require("../middleware/auth");

// Landing page - Login
router.get("/", redirectIfAuth, (req, res) => {
  res.render("auth/login", {
    title: "Sign In - Life Decision Helper",
    error: req.query.error
  });
});

// Signup page
router.get("/signup", redirectIfAuth, (req, res) => {
  res.render("auth/signup", {
    title: "Create Account - Life Decision Helper"
  });
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/?message=logged_out");
});

module.exports = router;