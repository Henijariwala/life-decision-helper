// server.js - Main Entry Point
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();

// ==================== MIDDLEWARE ====================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// ==================== VIEW ENGINE ====================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ==================== ROUTES ====================
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const adminRoutes = require("./routes/admin");

// Public routes
app.use("/", authRoutes);

// Protected routes
app.use("/chat", chatRoutes);
app.use("/admin", adminRoutes);

// ==================== 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).render("error", {
    title: "Page Not Found",
    message: "The page you're looking for doesn't exist.",
    code: 404
  });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(err.status || 500).render("error", {
    title: "Error",
    message: err.message || "Something went wrong",
    code: err.status || 500
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("╔════════════════════════════════════════╗");
  console.log("║   🚀 Life Decision Helper Server      ║");
  console.log("╠════════════════════════════════════════╣");
  console.log(`║   📍 Port: ${PORT.toString().padEnd(28)}║`);
  console.log(`║   🌍 Environment: ${(process.env.NODE_ENV || 'development').padEnd(18)}║`);
  console.log("║   ✅ Server running successfully!     ║");
  console.log("╚════════════════════════════════════════╝");
  console.log(`\n🌐 Visit: http://localhost:${PORT}\n`);
});

module.exports = app;