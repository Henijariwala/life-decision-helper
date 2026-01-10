const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.render("admin", {
    totalUsers: 0,
    totalDecisions: 0,
    categories: {}
  });
});

module.exports = router;
