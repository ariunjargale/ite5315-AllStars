/******************************************************************************
 * ITE5315 – Project
 * I declare that this project is my own work in accordance with Humber Academic Policy.
 * No part of this project has been copied manually or electronically from any other source
 * (including web sites) or distributed to other students.
 * Group Member Names: Ariunjargal Erdenebaatar, Samuel Law, Scarlett Jet
 * Student IDs: N01721372, N01699541, N01675129
 * Date: 2025/12/10
 ******************************************************************************/
const Auth = require("../models/User");
const { validationResult } = require("express-validator");

// Home Page
exports.home = (req, res) => {
  res.render("index", { title: "Showrunner's CMS - Rick and Morty" });
};
