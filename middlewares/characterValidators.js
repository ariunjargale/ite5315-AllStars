const { body, query, validationResult } = require("express-validator");

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

    body("status")
      .notEmpty()
      .withMessage("Status is required")
      .isIn(["alive", "dead", "unknown"])
      .withMessage("Invalid status"),

    body("species")
      .trim()
      .notEmpty()
      .withMessage("Species is required")
      .escape(),

    body("gender").optional().isIn(["Female", "Male", "Genderless", "Unknown"]),

    body("image")
      .trim()
      .notEmpty()
      .withMessage("Image URL is required")
      .isURL()
      .withMessage("Must be a valid URL"),
  ];
};
