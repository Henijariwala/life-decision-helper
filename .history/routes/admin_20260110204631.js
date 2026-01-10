const express = require("express");
const router = express.Router();
const { db } = require("../firebase/admin");
const adminAuth = require("../middleware/auth");

router.get("/", adminAuth, async (req, res) => {
  const usersSnap = await db.collection("users").get();
  const decisionsSnap = await db.collection("decisions").get();

  const categories = {};
  decisionsSnap.forEach(doc => {
    (doc.data().criteria || []).forEach(c => {
      categories[c] = (categories[c] || 0) + 1;
    });
  });

  res.render("admin", {
    totalUsers: usersSnap.size,
    totalDecisions: decisionsSnap.size,
    categories
  });
});

module.exports = router;
