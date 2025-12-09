const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authController = require("../controllers/authController");

// ==========================================
// SHOW PAGES (GET)
// ==========================================

// Show register page
router.get("/register", (req, res) => {
  res.render("auth/register");
});

// Show login page
router.get("/login", (req, res) => {
  res.render("auth/login");
});

// ==========================================
// VALIDATION RULES
// ==========================================

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
  body("username").notEmpty().withMessage("Username is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// ==========================================
// AUTHENTICATION ROUTES (POST)
// ==========================================

// Register user
router.post("/register", registerValidation, authController.register);

// Login user
router.post("/login", loginValidation, authController.login);

// Logout user (support both GET and POST)
router.get("/logout", authController.logout);
router.post("/logout", authController.logout);

// ==========================================
// PASSWORD RESET ROUTES
// ==========================================

// Show forgot password form
router.get("/forgot-password", authController.showForgotPassword);

// Handle forgot password submission
router.post("/forgot-password", authController.forgotPassword);

// Show reset password form (with token)
router.get("/reset-password/:token", authController.showResetPassword);

// Handle reset password submission
router.post("/reset-password/:token", authController.resetPassword);

// ==========================================
// API ROUTES
// ==========================================

// API Register
router.post("/api/register", registerValidation, authController.apiRegister);

// API Login
router.post("/api/login", loginValidation, authController.apiLogin);

// API Logout
router.post("/api/logout", authController.apiLogout);

module.exports = router;
