module.exports = (req, res, next) => {
  if (req.user.email !== "admin@email.com") {
    return res.status(403).send("Forbidden");
  }
  next();
};
