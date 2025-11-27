const mongoose = require("mongoose");

const LocationSchema = new mongoose.Schema({
  locationId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String },
  dimension: { type: String },
  residents: { type: [Number], required: true },
  created: { type: Date },
  updated: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Location", LocationSchema);
