const express = require("express");
const router = express.Router();

// Redirect home page to characters page
router.get("/", (req, res) => {
  res.redirect("/characters");
});

module.exports = router;
