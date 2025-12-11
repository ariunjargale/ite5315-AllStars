/******************************************************************************
 * ITE5315 – Project
 * I declare that this project is my own work in accordance with Humber Academic Policy.
 * No part of this project has been copied manually or electronically from any other source
 * (including web sites) or distributed to other students.
 * Group Member Names: Ariunjargal Erdenebaatar, Samuel Law, Scarlett Jet
 * Student IDs: N01721372, N01699541, N01675129
 * Date: 2025/12/10
 ******************************************************************************/
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
