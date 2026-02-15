// server.js - Main Entry Point
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();

// ==================== CONFIGURATION VALIDATION ====================
const validateConfig = () => {
  const required = ['OPENAI_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:", missing.join(', '));
    console.error("💡 Please check your .env file");
    process.exit(1);
  }
  
  console.log("✅ Configuration validated");
};

validateConfig();

// ==================== MIDDLEWARE ====================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Request logging middleware (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ==================== VIEW ENGINE ====================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ==================== HEALTH CHECK ====================
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing'
  });
});

app.get('/ping', (req, res) => {
  res.send('pong');
});

// ==================== ROUTES ====================
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
// const decisionRoutes = require("./routes/decision");
// const historyRoutes = require("./routes/history");
const adminRoutes = require("./routes/admin");

// Public routes (no auth required)
app.use("/", authRoutes);

// Protected routes (auth required)
app.use("/chat", chatRoutes);
// app.use("/decision", decisionRoutes);
// app.use("/history", historyRoutes);
app.use("/admin", adminRoutes);

// ==================== ERROR HANDLING ====================
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

// ==================== 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).render("error", {
    title: "Page Not Found",
    message: "The page you're looking for doesn't exist.",
    code: 404
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log("╔════════════════════════════════════════╗");
  console.log("║   🚀 Life Decision Helper Server      ║");
  console.log("╠════════════════════════════════════════╣");
  console.log(`║   📍 Port: ${PORT.toString().padEnd(28)}║`);
  console.log(`║   🌍 Environment: ${(process.env.NODE_ENV || 'development').padEnd(18)}║`);
  console.log(`║   🤖 OpenAI: ${(process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing').padEnd(23)}║`);
  console.log("║   ✅ Server is running successfully!  ║");
  console.log("╚════════════════════════════════════════╝");
  console.log("");
  console.log(`🌐 Local:    http://localhost:${PORT}`);
  console.log(`❤️  Health:   http://localhost:${PORT}/health`);
  console.log("");
});

// ==================== GRACEFUL SHUTDOWN ====================
const gracefulShutdown = (signal) => {
  console.log(`\n👋 ${signal} received. Shutting down gracefully...`);
  
  server.close(() => {
    console.log("✅ HTTP server closed");
    console.log("👋 Process terminated");
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error("❌ Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ==================== UNHANDLED ERRORS ====================
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to log this to an error tracking service
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // In production, you might want to restart the process
  process.exit(1);
});

module.exports = app;