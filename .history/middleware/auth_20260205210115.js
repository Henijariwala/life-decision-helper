//middleware/auth.js
const admin = require("../firebaseAdmin");

module.exports = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect("/");

    req.user = await admin.auth().verifyIdToken(token);
    next();
  } catch {
    res.redirect("/");
  }
};
