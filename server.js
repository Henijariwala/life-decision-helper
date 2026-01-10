require("dotenv").config();
const express = require("express");
const session = require("express-session");

const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
  secret: "decision-secret",
  resave: false,
  saveUninitialized: true
}));

app.use("/", require("./routes/user"));
app.use("/admin", require("./routes/admin"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
// 🚀 AUTO OPEN
});
