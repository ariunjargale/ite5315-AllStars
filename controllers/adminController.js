const User = require("../models/User");

// ==========================================
// SHOW ADMIN DASHBOARD
// ==========================================

exports.showAdminDashboard = async (req, res) => {
    try {
        const users = await User.find({}).sort({ created: -1 });
        res.render("admin/index", {
            title: "Admin Dashboard",
            users,
        });
    } catch (error) {
        console.error("Admin dashboard error:", error);
        res.status(500).render("error", {
            title: "Error",
            message: "Failed to load admin dashboard.",
        });
    }
};

// ==========================================
// BLOCK / UNBLOCK USER
// ==========================================

exports.toggleBlockUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            req.session.error = "User not found.";
            return res.redirect("/admin");
        }

        // Prevent self-blocking
        if (user._id.toString() === req.session.userId.toString()) {
            req.session.error = "You cannot block yourself.";
            return res.redirect("/admin");
        }

        user.isBlocked = !user.isBlocked;
        await user.save({ validateBeforeSave: false });

        req.session.success = user.isBlocked
            ? `User "${user.username}" has been blocked.`
            : `User "${user.username}" has been unblocked.`;
        res.redirect("/admin");
    } catch (error) {
        console.error("Toggle block user error:", error);
        req.session.error = "Failed to update user status.";
        res.redirect("/admin");
    }
};

// ==========================================
// FORCE PASSWORD RESET
// ==========================================

exports.forcePasswordReset = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            req.session.error = "User not found.";
            return res.redirect("/admin");
        }

        user.requirePasswordReset = true;
        await user.save({ validateBeforeSave: false });

        req.session.success = `User "${user.username}" will be required to reset their password on next login.`;
        res.redirect("/admin");
    } catch (error) {
        console.error("Force password reset error:", error);
        req.session.error = "Failed to force password reset.";
        res.redirect("/admin");
    }
};

// ==========================================
// DELETE USER
// ==========================================

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            req.session.error = "User not found.";
            return res.redirect("/admin");
        }

        // Prevent self-deletion
        if (user._id.toString() === req.session.userId.toString()) {
            req.session.error = "You cannot delete yourself.";
            return res.redirect("/admin");
        }

        await User.findByIdAndDelete(id);

        req.session.success = `User "${user.username}" has been deleted.`;
        res.redirect("/admin");
    } catch (error) {
        console.error("Delete user error:", error);
        req.session.error = "Failed to delete user.";
        res.redirect("/admin");
    }
};
