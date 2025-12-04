const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const controller = require("../controllers/locationController.js");
const { verifyToken } = require("../middlewares/verifyToken.js");

/* ============================================================
   VALIDATION RULES
   ============================================================ */

// Validation rules for creating a location
const validateLocation = [
  body("locationId")
    .exists()
    .withMessage("Location ID is required")
    .isInt({ min: 1 })
    .withMessage("Location ID must be a positive number")
    .toInt(),

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters"),

  body("type").optional({ checkFalsy: true }).trim().escape(),

  body("dimension").optional({ checkFalsy: true }).trim().escape(),
];

// Validation rules for updating a location (ID not updated)
const validateLocationUpdate = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters"),

  body("type").optional({ checkFalsy: true }).trim().escape(),

  body("dimension").optional({ checkFalsy: true }).trim().escape(),
];

/* ============================================================
   ROUTES
   ============================================================ */

// CREATE
router.get("/create", controller.showCreateForm);
router.post("/create", validateLocation, controller.createLocation);

// UPDATE (must be above /:id)
router.get("/edit/:id", controller.showEditForm);
router.post("/edit/:id", validateLocationUpdate, controller.updateLocation);

// DELETE
router.post("/delete/:id", controller.deleteLocation);

// API - Protected routes
router.post("/api/", verifyToken, controller.createLocation);
router.put("/api/:id", verifyToken, controller.updateLocation);
router.delete("/api/:id", verifyToken, controller.deleteLocation);

// LIST ALL (must be before /:id)
router.get("/", controller.getAllLocations);

// INDIVIDUAL LOCATION — MUST BE LAST
router.get("/:id", controller.getLocationById);

module.exports = router;
