const Episode = require("../models/Episode");
const Character = require("../models/Character");
const { validationResult } = require("express-validator");

// Helper function to determine if request expects JSON response
const expectsJson = (req) => {
    // Check if Accept header prefers JSON
    const acceptHeader = req.get("Accept") || "";
    // Check if it's an explicit JSON request or not a browser form submission
    return (
        acceptHeader.includes("application/json") ||
        (!acceptHeader.includes("text/html") && req.method === "POST")
    );
};

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

        // Fetch all characters that appear in this episode
        const characters = await Character.find({
            characterId: { $in: episode.characters },
        }).sort({ characterId: 1 });

        res.render("episodes/detail", {
            title: `${episode.name} - Rick and Morty`,
            episode: episode,
            characters: characters,
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
        // Return JSON error for API requests
        if (expectsJson(req)) {
            return res.status(400).json({
                success: false,
                error: "Validation failed",
                errors: errors.array().map(err => ({
                    field: err.path || err.param,
                    message: err.msg,
                    value: err.value
                }))
            });
        }

        // Return HTML for browser requests
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

        // Return JSON success for API requests
        if (expectsJson(req)) {
            return res.status(201).json({
                success: true,
                message: "Episode created successfully",
                data: newEpisode
            });
        }

        // Set success message in session for HTML redirect
        req.session.success = `Episode "${newEpisode.name}" has been created successfully.`;
        // Redirect for browser requests
        res.redirect("/episodes");
    } catch (err) {
        console.error(err);

        // Determine error type
        const isDuplicateError = err.code === 11000 || err.message.includes("duplicate");
        const statusCode = isDuplicateError ? 409 : 400;
        const errorMessage = isDuplicateError
            ? "Episode ID already exists"
            : "Invalid input data";

        // Return JSON error for API requests
        if (expectsJson(req)) {
            return res.status(statusCode).json({
                success: false,
                error: errorMessage,
                details: err.message
            });
        }

        // Return HTML for browser requests
        res.render("episodes/create", {
            title: "Create New Episode",
            error: errorMessage,
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
        // Return JSON error for API requests
        if (expectsJson(req)) {
            return res.status(400).json({
                success: false,
                error: "Validation failed",
                errors: errors.array().map(err => ({
                    field: err.path || err.param,
                    message: err.msg,
                    value: err.value
                }))
            });
        }

        // Return HTML for browser requests
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
        const updatedEpisode = await Episode.findOneAndUpdate(
            { episodeId: req.params.id },
            {
                name: req.body.name,
                air_date: req.body.air_date,
                episode: req.body.episode,
                characters: req.body.characters || [],
                updated: new Date(),
            },
            { new: true } // Return the updated document
        );

        if (!updatedEpisode) {
            if (expectsJson(req)) {
                return res.status(404).json({
                    success: false,
                    error: "Episode not found"
                });
            }
            return res.status(404).render("error", {
                title: "Not Found",
                message: "Episode not found",
            });
        }

        // Return JSON success for API requests
        if (expectsJson(req)) {
            return res.status(200).json({
                success: true,
                message: "Episode updated successfully",
                data: updatedEpisode
            });
        }

        // Set success message in session for HTML redirect
        req.session.success = `Episode "${updatedEpisode.name}" has been updated successfully.`;
        res.redirect(`/episodes/${req.params.id}`);
    } catch (err) {
        console.error(err);

        if (expectsJson(req)) {
            return res.status(500).json({
                success: false,
                error: "Failed to update episode",
                details: err.message
            });
        }

        res.status(500).send("Failed to update episode");
    }
};

// Delete episode
exports.deleteEpisode = async (req, res) => {
    try {
        const deletedEpisode = await Episode.findOneAndDelete({ episodeId: req.params.id });

        if (!deletedEpisode) {
            if (expectsJson(req)) {
                return res.status(404).json({
                    success: false,
                    error: "Episode not found"
                });
            }
            return res.status(404).render("error", {
                title: "Not Found",
                message: "Episode not found",
            });
        }

        // Return JSON success for API requests
        if (expectsJson(req)) {
            return res.status(200).json({
                success: true,
                message: "Episode deleted successfully",
                data: deletedEpisode
            });
        }

        // Set success message in session for HTML redirect
        req.session.success = `Episode "${deletedEpisode.name}" has been deleted successfully.`;
        res.redirect("/episodes");
    } catch (err) {
        console.error(err);

        if (expectsJson(req)) {
            return res.status(500).json({
                success: false,
                error: "Failed to delete episode",
                details: err.message
            });
        }

        res.status(500).send("Failed to delete episode");
    }
};
