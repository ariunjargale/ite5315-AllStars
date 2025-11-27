const express = require("express");
const router = express.Router();
const controller = require("../controllers/locationController.js");

// List all locations
router.get("/", controller.getAllLocations);

// Get specific location by ID
router.get("/:id", controller.getLocationById);

module.exports = router;
