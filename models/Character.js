const mongoose = require("mongoose");

const CharacterSchema = new mongoose.Schema({
  characterId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  isAlive: { type: Boolean, required: true },
  species: { type: String },
  type: { type: String },
  gender: {
    type: String,
    enum: ["Female", "Male", "Genderless", "unknown"],
    default: "unknown",
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
