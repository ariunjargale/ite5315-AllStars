const Auth = require("../models/User");
const { validationResult } = require("express-validator");

// Home Page
exports.home = (req, res) => {
  res.render("index", { title: "Showrunner's CMS - Rick and Morty" });
};
