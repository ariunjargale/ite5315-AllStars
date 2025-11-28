const Episode = require("../models/Episode");
const { validationResult } = require("express-validator");

// Get all episodes (with pagination and filters)
exports.getAllEpisodes = async (req, res) => {
    try {
        const perPage = 12;
        const page = parseInt(req.query.page) || 1;

        // Build filters
        const filter = {};

        // Filter by season (extract from episode code like S01E01)
        if (req.query.season && req.query.season !== "all") {
            // Match episodes that start with the selected season (e.g., S01)
            filter.episode = new RegExp(`^${req.query.season}`, "i");
        }

        const totalEpisodes = await Episode.countDocuments(filter);

        const episodes = await Episode.find(filter)
            .sort({ episodeId: 1 })
            .skip((page - 1) * perPage)
            .limit(perPage);

        // Get all unique seasons from episode codes
        const allEpisodes = await Episode.find({}).select("episode");
        const allSeasons = [
            ...new Set(
                allEpisodes.map((ep) => {
                    // Extract season from episode code (e.g., S01E01 -> S01)
                    const match = ep.episode.match(/^S\d{2}/);
                    return match ? match[0] : null;
                }).filter(Boolean)
            ),
        ].sort();

        res.render("episodes/list", {
            title: "All Episodes - Rick and Morty",
            episodes,
            totalEpisodes,
            currentPage: page,
            totalPages: Math.ceil(totalEpisodes / perPage),
            allSeasons,
            selectedSeason: req.query.season || "all",
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

// Show create form
exports.showCreateForm = (req, res) => {
    res.render("episodes/create", {
        title: "Create New Episode",
    });
};

// Create new episode
exports.createEpisode = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.render("episodes/create", {
            title: "Create New Episode",
            errors: errors.array(),
            form: req.body,
        });
    }

    try {
        const newEpisode = new Episode({
            episodeId: req.body.episodeId,
            name: req.body.name,
            air_date: req.body.air_date,
            episode: req.body.episode,
            characters: req.body.characters || [],
            created: new Date(),
            updated: new Date(),
        });

        await newEpisode.save();
        res.redirect("/episodes");
    } catch (err) {
        console.error(err);
        res.render("episodes/create", {
            title: "Create New Episode",
            error: "Episode ID already exists or invalid input",
            form: req.body,
        });
    }
};

// Show edit form
exports.showEditForm = async (req, res) => {
    try {
        const episode = await Episode.findOne({ episodeId: req.params.id });

        if (!episode) {
            return res.status(404).render("error", {
                title: "Not Found",
                message: "Episode not found",
            });
        }

        res.render("episodes/edit", {
            title: "Edit Episode",
            episode,
        });
    } catch (error) {
        console.error("Error fetching episode:", error);
        res.status(500).render("error", {
            title: "Error",
            message: "Failed to fetch episode",
        });
    }
};

// Update episode
exports.updateEpisode = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const episode = await Episode.findOne({
            episodeId: req.params.id,
        });

        return res.render("episodes/edit", {
            title: "Edit Episode",
            errors: errors.array(),
            episode,
        });
    }

    try {
        await Episode.findOneAndUpdate(
            { episodeId: req.params.id },
            {
                name: req.body.name,
                air_date: req.body.air_date,
                episode: req.body.episode,
                characters: req.body.characters || [],
                updated: new Date(),
            }
        );

        res.redirect(`/episodes/${req.params.id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to update episode");
    }
};

// Delete episode
exports.deleteEpisode = async (req, res) => {
    try {
        await Episode.findOneAndDelete({ episodeId: req.params.id });
        res.redirect("/episodes");
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to delete episode");
    }
};
