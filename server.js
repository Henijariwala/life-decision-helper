require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");

const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: true, sameSite: "lax" }
  })
);

app.use("/", require("./routes/user"));
app.use("/admin", require("./routes/admin"));

app.get("/health", (_, res) => res.send("OK"));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Server error");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on", PORT));
