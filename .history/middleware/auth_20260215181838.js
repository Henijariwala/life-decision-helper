// middleware/auth.js - Authentication Middleware
const admin = require("../firebase");

const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.redirect("/?error=login_required");
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email
    };
    
    next();
  } catch (error) {
    console.error("❌ Auth Error:", error.message);
    res.clearCookie("token");
    return res.redirect("/?error=session_expired");
  }
};

module.exports = { requireAuth };