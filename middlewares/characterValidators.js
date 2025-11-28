const { body, query } = require("express-validator");

// Search validation rules for querying characters
exports.searchValidationRules = () => {
  return [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive number")
      .toInt(),
    query("name").optional().trim().escape(),
    query("species").optional().trim().escape(),
    query("status")
      .optional()
      .isIn(["alive", "dead", "unknown", ""])
      .withMessage("Invalid status value"),
  ];
};

// POST/PUT character validation rules
exports.characterValidationRules = () => {
  return [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Character name is required")
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 chars")
      .escape(),
    body("isAlive")
      .notEmpty()
      .withMessage("Status is required")
      .isIn(["true", "false"])
      .withMessage("Invalid status value"),
    body("species")
      .trim()
      .notEmpty()
      .withMessage("Species is required")
      .escape(),
    body("gender")
      .optional()
      .isIn(["Female", "Male", "Genderless", "Unknown"])
      .withMessage("Invalid Gender"),
    body("image")
      .trim()
      .notEmpty()
      .withMessage("Image URL is required")
      .isURL()
      .withMessage("Must be a valid URL"),
    body("location.name")
      .trim()
      .notEmpty()
      .withMessage("Location Name is required")
      .escape(),
    body("origin.name").optional().trim().escape(),
    body("episode")
      .trim()
      .matches(/^[\d,\s]*$/)
      .withMessage("Episodes must be numbers separated by commas (e.g. 1, 2)"),
    body("locationId")
      .notEmpty()
      .withMessage("Last Known Location is required")
      .isInt()
      .withMessage("Invalid Location ID"),
    body("originId").optional().isInt().withMessage("Invalid Origin ID"),
  ];
};
