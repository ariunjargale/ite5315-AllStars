/******************************************************************************
 * ITE5315 – Project
 * I declare that this project is my own work in accordance with Humber Academic Policy.
 * No part of this project has been copied manually or electronically from any other source
 * (including web sites) or distributed to other students.
 * Group Member Names: Ariunjargal Erdenebaatar, Samuel Law, Scarlett Jet
 * Student IDs: N01721372, N01699541, N01675129
 * Date: 2025/12/10
 ******************************************************************************/
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const controller = require("../controllers/episodeController.js");
const { requireAdmin } = require("../middlewares/auth.js");
const { verifyToken } = require("../middlewares/verifyToken.js");

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

  body("air_date").trim().notEmpty().withMessage("Air date is required"),

  body("episode")
    .trim()
    .notEmpty()
    .withMessage("Episode code is required (e.g., S01E01)")
    .matches(/^S\d{2}E\d{2}$/)
    .withMessage(
      "Episode code must follow the pattern S##E## (e.g., S01E01, S02E10)"
    ),

  body("characters")
    .optional()
    .customSanitizer((value) => {
      if (typeof value === "string") {
        return value
          .split(",")
          .map((id) => parseInt(id.trim()))
          .filter((id) => !isNaN(id));
      }
      return Array.isArray(value) ? value : [];
    }),
];

// CREATE
router.get("/create", requireAdmin, controller.showCreateForm);
router.post("/create", requireAdmin, validateEpisode, controller.createEpisode);

// EDIT
router.get("/edit/:id", requireAdmin, controller.showEditForm);
router.post(
  "/edit/:id",
  requireAdmin,
  validateEpisode,
  controller.updateEpisode
);

// DELETE
router.post("/delete/:id", requireAdmin, controller.deleteEpisode);

// API PROTECTED ROUTES
router.post("/api/", verifyToken, controller.createEpisode);
router.put("/api/:id", verifyToken, controller.updateEpisode);
router.delete("/api/:id", verifyToken, controller.deleteEpisode);

// LIST (must be before the ID route)
router.get("/", controller.getAllEpisodes);

// MUST BE LAST — catches numeric IDs only
router.get("/:id", controller.getEpisodeById);

module.exports = router;
