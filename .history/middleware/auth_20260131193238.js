const admin = require("../firebaseAdmin");

module.exports = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.redirect("/");
    }

    // ✅ Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // decodedToken contains: uid, email, etc.
    req.user = decodedToken;

    next();
  } catch (err) {
    console.error("AUTH ERROR:", err.message);
    res.redirect("/");
  }
};
