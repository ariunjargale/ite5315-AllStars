const express = require("express");
const router = express.Router();
const controller = require("../controllers/characterController.js");
const {
  searchValidationRules,
  characterValidationRules,
} = require("../middlewares/characterValidators.js");

// CREATE
router.get("/create", controller.getCreateForm);
router.post("/create", characterValidationRules, controller.createCharacter);

// UPDATE
router.get("/edit/:id", controller.getEditForm);
router.post("/edit/:id", characterValidationRules, controller.updateCharacter);

// Get specific character by ID
router.get("/:id", controller.getCharacterById);

// List all characters
router.get("/", searchValidationRules(), controller.getAllCharacters);

module.exports = router;
