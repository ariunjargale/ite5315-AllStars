const express = require("express");
const router = express.Router();
const controller = require("../controllers/characterController.js");
const {
  searchValidationRules,
} = require("../middlewares/characterValidators.js");

// List all characters
router.get("/", searchValidationRules(), controller.getAllCharacters);

// Get specific character by ID
router.get("/:id", controller.getCharacterById);

module.exports = router;
