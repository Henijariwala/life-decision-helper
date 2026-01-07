function requireUser(req, res, next) {
  if (!req.headers.userid) {
    return res.redirect("/");
  }
  next();
}

function requireAdmin(req, res, next) {
  if (req.headers.role !== "admin") {
    return res.send("Access Denied");
  }
  next();
}

module.exports = { requireUser, requireAdmin };
