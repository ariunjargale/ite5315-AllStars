const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authController = require("../controllers/authController");

// =========================
// SHOW REGISTER PAGE (GET)
// =========================
router.get("/register", (req, res) => {
  res.render("auth/register"); // views/auth/register.hbs
});

// =========================
// SHOW LOGIN PAGE (GET)
// =========================
router.get("/login", (req, res) => {
  res.render("auth/login"); // views/auth/login.hbs (Ari will build)
});

// =========================
// VALIDATION RULES
// =========================

// Registration validation
const registerValidation = [
  body("username")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

// Login validation
const loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

// =========================
// AUTH API ROUTES (POST)
// =========================

// Register user
router.post("/register", registerValidation, authController.register);

// Login user
router.post("/login", loginValidation, authController.login);

// Logout user
router.post("/logout", authController.logout);

module.exports = router;
