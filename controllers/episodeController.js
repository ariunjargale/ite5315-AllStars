const Episode = require("../models/Episode");
const { validationResult } = require("express-validator");

// Get all episodes
exports.getAllEpisodes = async (req, res) => {
    try {
        const episodes = await Episode.find().sort({ episodeId: 1 });
        res.render("episodes/list", {
            title: "All Episodes - Rick and Morty",
            episodes: episodes,
        });
    } catch (error) {
        console.error("Error fetching episodes:", error);
        res.status(500).render("error", {
            title: "Error",
            message: "Failed to fetch episodes",
        });
    }
};

// Get episode by ID
exports.getEpisodeById = async (req, res) => {
    try {
        const episode = await Episode.findOne({
            episodeId: req.params.id,
        });
        if (!episode) {
            return res.status(404).render("error", {
                title: "Not Found",
                message: "Episode not found",
            });
        }
        res.render("episodes/detail", {
            title: `${episode.name} - Rick and Morty`,
            episode: episode,
        });
    } catch (error) {
        console.error("Error fetching episode:", error);
        res.status(500).render("error", {
            title: "Error",
            message: "Failed to fetch episode",
        });
    }
};
