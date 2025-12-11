/******************************************************************************
 * ITE5315 – Project
 * I declare that this project is my own work in accordance with Humber Academic Policy.
 * No part of this project has been copied manually or electronically from any other source
 * (including web sites) or distributed to other students.
 * Group Member Names: Ariunjargal Erdenebaatar, Samuel Law, Scarlett Jet
 * Student IDs: N01721372, N01699541, N01675129
 * Date: 2025/12/10
 ******************************************************************************/
require("dotenv").config();

module.exports = {
  url: process.env.MONGO_URI,
  port: process.env.PORT || 8000,
  env: process.env.NODE_ENV || "development",
};
