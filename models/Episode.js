const mongoose = require("mongoose");

const EpisodeSchema = new mongoose.Schema({
    episodeId: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    air_date: { type: String, required: true },
    episode: { type: String, required: true },
    characters: { type: [Number], required: true },
    created: { type: Date },
    updated: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Episode", EpisodeSchema);
