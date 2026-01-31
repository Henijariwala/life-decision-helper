const admin = require("../firebaseAdmin");

module.exports = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect("/");

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // email, uid
    next();
  } catch {
    res.redirect("/");
  }
};
