module.exports = async (req, res, next) => {
  if (!req.session.user || !req.session.user.admin) {
    return res.status(403).send("Access Denied");
  }
  next();
};

