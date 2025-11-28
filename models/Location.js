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
