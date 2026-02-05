// middleware/auth.js - User Authentication Middleware
const { auth } = require("../config/firebase");

/**
 * Middleware to verify user authentication
 * Checks if user has valid Firebase ID token in cookies
 */
const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.redirect("/?error=auth_required");
    }

    // Verify Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);
    
    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified
    };

    next();
  } catch (error) {
    console.error("❌ Authentication error:", error.message);
    
    // Clear invalid token
    res.clearCookie("token");
    
    return res.redirect("/?error=invalid_token");
  }
};

/**
 * Middleware to check if user is already authenticated
 * Redirects to chat if already logged in
 */
const redirectIfAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (token) {
      const decodedToken = await auth.verifyIdToken(token);
      if (decodedToken) {
        return res.redirect("/chat");
      }
    }
    
    next();
  } catch (error) {
    // Token is invalid, clear it and continue
    res.clearCookie("token");
    next();
  }
};

module.exports = {
  requireAuth,
  redirectIfAuth
};