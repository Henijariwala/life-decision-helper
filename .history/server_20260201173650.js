require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();

// ---------- VIEW ENGINE ----------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ---------- MIDDLEWARE ----------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// ---------- STATIC FILES ----------
app.use(express.static(path.join(__dirname, "public")));

// ---------- ROUTES ----------
app.use("/", require("./routes/user"));
app.use("/admin", require("./routes/admin"));

// ---------- GLOBAL ERROR ----------
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).send("Something went wrong");
});

// ---------- SERVER ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
