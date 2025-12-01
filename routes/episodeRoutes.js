const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const controller = require("../controllers/episodeController.js");

// Validation rules for episode data
const validateEpisode = [
    body("episodeId")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Episode ID must be a positive number")
        .toInt(),

    body("name")
        .trim()
        .isLength({ min: 2 })
        .withMessage("Name must be at least 2 characters"),

    body("air_date")
        .trim()
        .notEmpty()
        .withMessage("Air date is required"),

    body("episode")
        .trim()
        .notEmpty()
        .withMessage("Episode code is required (e.g., S01E01)")
        .matches(/^S\d{2}E\d{2}$/)
        .withMessage("Episode code must follow the pattern S##E## (e.g., S01E01, S02E10)"),

    body("characters")
        .optional()
        .customSanitizer((value) => {
            if (typeof value === "string") {
                return value.split(",").map((id) => parseInt(id.trim())).filter((id) => !isNaN(id));
            }
            return Array.isArray(value) ? value : [];
        }),
];

// CREATE
router.get("/create", controller.showCreateForm);
router.post("/create", validateEpisode, controller.createEpisode);

// EDIT
router.get("/edit/:id", controller.showEditForm);
router.post("/edit/:id", validateEpisode, controller.updateEpisode);

// DELETE
router.post("/delete/:id", controller.deleteEpisode);

// LIST (must be before the ID route)
router.get("/", controller.getAllEpisodes);

// MUST BE LAST — catches numeric IDs only
router.get("/:id", controller.getEpisodeById);

module.exports = router;
