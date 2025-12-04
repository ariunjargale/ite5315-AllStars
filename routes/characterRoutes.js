const express = require("express");
const router = express.Router();
const controller = require("../controllers/characterController.js");
const {
  searchValidationRules,
  characterValidationRules,
} = require("../middlewares/characterValidators.js");
const { requireLogin } = require("../middlewares/auth.js");
const { verifyToken } = require("../middlewares/verifyToken.js");

// CREATE
router.get("/create", requireLogin, controller.getCreateForm);
router.post(
  "/create",
  requireLogin,
  characterValidationRules(),
  controller.createCharacter
);

// UPDATE
router.get("/edit/:id", requireLogin, controller.getEditForm);
router.post(
  "/edit/:id",
  requireLogin,
  characterValidationRules(),
  controller.updateCharacter
);

// DELETE
router.post("/delete/:id", requireLogin, controller.deleteCharacter);

// API - Protected routes
router.post("/api", verifyToken, controller.createCharacter);
router.put("/api/:id", verifyToken, controller.updateCharacter);
router.delete("/api/:id", verifyToken, controller.deleteCharacter);

// Get specific character by ID
router.get("/:id", controller.getCharacterById);

// List all characters
router.get("/", searchValidationRules(), controller.getAllCharacters);

module.exports = router;
