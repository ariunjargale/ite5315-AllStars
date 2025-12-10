const express = require("express");
const router = express.Router();
const { requireLogin } = require("../middlewares/auth");

// Home page - Entry point
router.get("/", (req, res) => {
  res.render("home", {
    title: "Welcome to the Multiverse",
  });
});

// Dashboard page - Analytics
router.get("/dashboard", (req, res) => {
  res.render("dashboard", {
    title: "Multiverse Analytics Dashboard",
  });
});

module.exports = router;
