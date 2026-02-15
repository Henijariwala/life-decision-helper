// server.js - Main Entry Point (Fixed for user.js routes)
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
// Since you have all routes in routes/user.js, just use that one file
const userRoutes = require("./routes/user");

// All routes handled by user.js
app.use("/", userRoutes);

// ==================== 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>404 - Page Not Found</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          padding: 50px;
          background: #f5f5f5;
        }
        h1 { color: #333; font-size: 48px; }
        p { color: #666; font-size: 18px; }
        a { color: #667eea; text-decoration: none; font-weight: bold; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>404</h1>
      <p>Page Not Found</p>
      <p><a href="/">← Go Home</a></p>
    </body>
    </html>
  `);
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  console.error(err.stack);
  
  res.status(err.status || 500).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Error</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          padding: 50px;
          background: #f5f5f5;
        }
        h1 { color: #E76F51; font-size: 48px; }
        p { color: #666; font-size: 18px; }
        a { color: #667eea; text-decoration: none; font-weight: bold; }
        .error-details {
          background: #fff;
          padding: 20px;
          border-radius: 10px;
          margin: 20px auto;
          max-width: 600px;
          text-align: left;
        }
      </style>
    </head>
    <body>
      <h1>⚠️ Error</h1>
      <p>${err.message || 'An error occurred'}</p>
      ${process.env.NODE_ENV === 'development' ? `
        <div class="error-details">
          <strong>Stack Trace:</strong>
          <pre style="overflow-x: auto;">${err.stack}</pre>
        </div>
      ` : ''}
      <p><a href="/">← Go Home</a></p>
    </body>
    </html>
  `);
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log("╔════════════════════════════════════════╗");
  console.log("║   🚀 Life Decision Helper Server      ║");
  console.log("╠════════════════════════════════════════╣");
  console.log(`║   📍 Port: ${PORT.toString().padEnd(28)}║`);
  console.log(`║   🌍 Environment: ${(process.env.NODE_ENV || 'development').padEnd(18)}║`);
  console.log("║   ✅ Server running successfully!     ║");
  console.log("╚════════════════════════════════════════╝");
  console.log(`\n🌐 Visit: http://localhost:${PORT}\n`);
});

// ==================== GRACEFUL SHUTDOWN ====================
process.on("SIGTERM", () => {
  console.log("\n👋 SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\n👋 SIGINT received. Shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

module.exports = app;