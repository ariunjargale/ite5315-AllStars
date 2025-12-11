/******************************************************************************
 * ITE5315 – Project
 * I declare that this project is my own work in accordance with Humber Academic Policy.
 * No part of this project has been copied manually or electronically from any other source
 * (including web sites) or distributed to other students.
 * Group Member Names: Ariunjargal Erdenebaatar, Samuel Law, Scarlett Jet
 * Student IDs: N01721372, N01699541, N01675129
 * Date: 2025/12/10
 ******************************************************************************/
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
