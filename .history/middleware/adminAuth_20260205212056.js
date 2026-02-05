// middleware/adminAuth.js - Admin Authentication Middleware
const { requireAuth } = require("./auth");

/**
 * Middleware to verify admin access
 * Must be used after requireAuth middleware
 */
const requireAdmin = (req, res, next) => {
  // Check if user is authenticated
  if (!req.user || !req.user.email) {
    return res.status(401).render("error", {
      title: "Unauthorized",
      message: "You must be logged in to access this page.",
      code: 401
    });
  }

  // Check if user is admin
  const adminEmail = process.env.ADMIN_EMAIL;
  
  if (req.user.email !== adminEmail) {
    return res.status(403).render("error", {
      title: "Forbidden",
      message: "You don't have permission to access this page.",
      code: 403
    });
  }

  next();
};

/**
 * Combined middleware: requireAuth + requireAdmin
 */
const adminAuth = [requireAuth, requireAdmin];

module.exports = {
  requireAdmin,
  adminAuth
};