const express = require("express");
const router = express.Router();
const { db } = require("../firebase/admin");

router.get("/", async (req, res) => {
  const users = await db.collection("users").get();
  const decisions = await db.collection("decisions").get(); 

  res.render("admin", {
    totalUsers: users.size,
    totalDecisions: decisions.size
  });
});

module.exports = router;
