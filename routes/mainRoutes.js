const express = require("express");
const router = express.Router();
const { requireLogin } = require("../middlewares/auth");

// Redirect home page to characters page
router.get("/", (req, res) => {
  res.redirect("/characters");
});

// Dashboard page (protected)
router.get("/dashboard", requireLogin, (req, res) => {
  res.render("dashboard", {
    title: "Multiverse Analytics Dashboard",
  });
});

module.exports = router;
