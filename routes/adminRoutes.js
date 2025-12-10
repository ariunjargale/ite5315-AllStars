const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { requireAdmin } = require("../middlewares/auth");

// All routes require admin access
router.use(requireAdmin);

// Admin dashboard - list all users
router.get("/", adminController.showAdminDashboard);

// Block/unblock user
router.post("/block/:id", adminController.toggleBlockUser);

// Force password reset
router.post("/reset-password/:id", adminController.forcePasswordReset);

// Delete user
router.post("/delete/:id", adminController.deleteUser);

module.exports = router;
