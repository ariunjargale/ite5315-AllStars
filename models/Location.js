/******************************************************************************
 * ITE5315 – Project
 * I declare that this project is my own work in accordance with Humber Academic Policy.
 * No part of this project has been copied manually or electronically from any other source
 * (including web sites) or distributed to other students.
 * Group Member Names: Ariunjargal Erdenebaatar, Samuel Law, Scarlett Jet
 * Student IDs: N01721372, N01699541, N01675129
 * Date: 2025/12/10
 ******************************************************************************/
const mongoose = require("mongoose");

const LocationSchema = new mongoose.Schema({
  locationId: {
    type: Number,
    required: [true, "Location ID is required"],
    unique: true,
    min: [1, "Location ID must be a positive number"],
  },

  name: {
    type: String,
    required: [true, "Location name is required"],
    trim: true,
    maxlength: [100, "Location name cannot exceed 100 characters"],
  },

  type: {
    type: String,
    trim: true,
    default: "Unknown",
  },

  dimension: {
    type: String,
    trim: true,
    default: "Unknown",
  },

  residents: {
    type: [Number],
    default: [],
  },

  //coordinates for MongoDB Atlas Charts
  coordinates: {
    lat: { type: Number, required: false },
    lng: { type: Number, required: false },
  },

  created: {
    type: Date,
    default: Date.now,
  },

  updated: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Location", LocationSchema);
