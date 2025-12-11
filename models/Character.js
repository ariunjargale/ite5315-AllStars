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

const CharacterSchema = new mongoose.Schema({
  characterId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  isAlive: { type: Boolean, required: true },
  species: { type: String },
  type: { type: String },
  gender: {
    type: String,
    enum: ["Female", "Male", "Genderless", "Unknown"],
    default: "Unknown",
  },
  location: {
    name: { type: String },
    id: { type: Number, required: true },
  },
  origin: {
    name: { type: String },
    id: { type: Number },
  },
  image: { type: String },
  episode: { type: [Number], required: true },
  created: { type: Date },
  updated: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Character", CharacterSchema);
