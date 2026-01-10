const express = require("express");
const session = require("express-session");

const app = express();

// ---------- BASIC SETUP ----------
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: "life-decision-secret",
    resave: false,
    saveUninitialized: true
  })
);

// ---------- ROUTES ----------
app.use("/", require("./routes/user"));
app.use("/admin", require("./routes/admin"));

// ---------- ERROR HANDLER ----------
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err.message);
  res.status(500).send("Something went wrong. Please try again.");
});

// ---------- START ----------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
  console.log("OPENAI KEY PRESENT:", !!process.env.OPENAI_API_KEY);
});
