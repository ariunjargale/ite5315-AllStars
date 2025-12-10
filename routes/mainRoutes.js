const express = require("express");
const router = express.Router();
const { requireLogin } = require("../middlewares/auth");

// Redirect home page - Dashboard
router.get("/", (req, res) => {
  res.render("dashboard", {
    title: "Multiverse Analytics Dashboard",
  });
});

module.exports = router;
