const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const controller = require("../controllers/locationController.js");

// Validation rules for location data
const validateLocation = [
  body("locationId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Location ID must be a positive number")
    .toInt(),

  body("name")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters"),

  body("type").optional({ checkFalsy: true }).trim().escape(),

  body("dimension").optional({ checkFalsy: true }).trim().escape(),
];

// CREATE
router.get("/create", controller.showCreateForm);
router.post("/create", validateLocation, controller.createLocation);

// EDIT
router.get("/edit/:id", controller.showEditForm);
router.post("/edit/:id", validateLocation, controller.updateLocation);

// DELETE
router.post("/delete/:id", controller.deleteLocation);

// LIST (must be before the ID route)
router.get("/", controller.getAllLocations);

// MUST BE LAST — catches numeric IDs only
router.get("/:id", controller.getLocationById);

module.exports = router;
