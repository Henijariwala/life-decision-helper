const { auth } = require("../firebase/admin");

module.exports = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect("/");

    req.user = await auth.verifyIdToken(token);
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    res.redirect("/");
  }
};
