const Auth = require("../models/User");
const { validationResult } = require("express-validator");

// Home Page
exports.home = (req, res) => {
  res.render("index", { title: "CMS - Rick and Morty" });
};
