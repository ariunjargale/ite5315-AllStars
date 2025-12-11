const express = require("express");
const router = express.Router();
const controller = require("../controllers/characterController.js");
const {
  searchValidationRules,
  characterValidationRules,
} = require("../middlewares/characterValidators.js");
const { requireAdmin } = require("../middlewares/auth.js");
const { verifyToken } = require("../middlewares/verifyToken.js");

// CREATE
router.get("/create", requireAdmin, controller.getCreateForm);
router.post(
  "/create",
  requireAdmin,
  characterValidationRules(),
  controller.createCharacter
);

// UPDATE
router.get("/edit/:id", requireAdmin, controller.getEditForm);
router.post(
  "/edit/:id",
  requireAdmin,
  characterValidationRules(),
  controller.updateCharacter
);

// DELETE
router.post("/delete/:id", requireAdmin, controller.deleteCharacter);

// API - Protected routes
router.post("/api", verifyToken, controller.createCharacter);
router.put("/api/:id", verifyToken, controller.updateCharacter);
router.delete("/api/:id", verifyToken, controller.deleteCharacter);

// Get specific character by ID
router.get("/:id", controller.getCharacterById);

// List all characters
router.get("/", searchValidationRules(), controller.getAllCharacters);

module.exports = router;
