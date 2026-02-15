// middleware/auth.js - Authentication Middleware
const admin = require("../firebaseAdmin");

/**
 * Middleware to require authentication
 * Verifies Firebase token from cookie
 */
const requireAuth = async (req, res, next) => {
  try {
    // Get token from cookie
    const token = req.cookies.token;
    
    if (!token) {
      return res.redirect("/");
    }

    // Verify token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified
    };
    
    next();
  } catch (error) {
    console.error("❌ Authentication Error:", error.message);
    
    // Clear invalid token
    res.clearCookie("token");
    
    // Redirect to login
    return res.redirect("/?error=session_expired");
  }
};

/**
 * Middleware for optional authentication
 * Attaches user if logged in, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (token) {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified
      };
    }
    
    next();
  } catch (error) {
    // Just continue without user info
    next();
  }
};

/**
 * Middleware to check if user is admin
 * Must be used after requireAuth
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Get user from Firestore
    const db = admin.firestore();
    const userDoc = await db
      .collection("users")
      .doc(req.user.email)
      .get();

    if (!userDoc.exists) {
      return res.status(403).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    
    if (!userData.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    req.user.isAdmin = true;
    next();
  } catch (error) {
    console.error("❌ Admin Check Error:", error.message);
    return res.status(500).json({ error: "Failed to verify admin status" });
  }
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireAdmin
};