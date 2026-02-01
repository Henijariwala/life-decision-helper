const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// routes
const userRoutes = require("./routes/user");
app.use("/", userRoutes);

// port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
