//routes/admin.js
const express = require("express");
const requireAuth = require("../middleware/auth");
// const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

router.get("/", requireAuth, adminOnly, (req, res) => {
  res.render("admin", {
    totalUsers: 0,
    totalDecisions: 0,
    categories: {}
  });
});

module.exports = router;
