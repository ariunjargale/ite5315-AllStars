const express = require("express");
const router = express.Router();
const controller = require("../controllers/episodeController.js");

// List all episodes
router.get("/", controller.getAllEpisodes);

// Get specific episode by ID
router.get("/:id", controller.getEpisodeById);

module.exports = router;
