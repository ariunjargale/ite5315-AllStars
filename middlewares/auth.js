/******************************************************************************
 * ITE5315 – Project
 * I declare that this project is my own work in accordance with Humber Academic Policy.
 * No part of this project has been copied manually or electronically from any other source
 * (including web sites) or distributed to other students.
 * Group Member Names: Ariunjargal Erdenebaatar, Samuel Law, Scarlett Jet
 * Student IDs: N01721372, N01699541, N01675129
 * Date: 2025/12/10
 ******************************************************************************/
const User = require("../models/User");

exports.requireLogin = (req, res, next) => {
  if (!req.session?.userId) {
    return res.redirect("/auth/login");
  }
  next();
};

exports.requireAdmin = (req, res, next) => {
  if (!req.session?.userId) {
    return res.redirect("/auth/login");
  }
  if (req.session.role !== "admin") {
    return res.status(403).render("error", {
      title: "Access Denied",
      message:
        "You do not have permission to access this page. Admin access required.",
    });
  }
  next();
};

// Middleware to check if user needs to reset password
// This should be applied globally to redirect users who need to reset their password
exports.checkPasswordReset = async (req, res, next) => {
  // Skip if not logged in
  if (!req.session?.userId) {
    return next();
  }

  // Skip if already on auth routes (login, logout, reset-password, forgot-password)
  const fullPath = req.originalUrl || req.url;
  if (fullPath.startsWith("/auth/")) {
    return next();
  }

  // FIRST: Check if session has the mustResetPassword flag set
  if (req.session.mustResetPassword === true) {
    // User must reset password - redirect to reset page
    if (req.session.resetToken) {
      return res.redirect(`/auth/reset-password/${req.session.resetToken}`);
    }
    // If no token in session, generate one
    try {
      const user = await User.findById(req.session.userId);
      if (user) {
        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });
        req.session.resetToken = resetToken;
        return res.redirect(`/auth/reset-password/${resetToken}`);
      }
    } catch (error) {
      console.error("Error generating reset token:", error);
    }
  }

  // SECOND: Check database for requirePasswordReset flag (in case flag was set by admin after login)
  try {
    const user = await User.findById(req.session.userId).lean();
    if (user && user.requirePasswordReset) {
      // Set session flag and generate token
      const userDoc = await User.findById(req.session.userId);
      const resetToken = userDoc.createPasswordResetToken();
      await userDoc.save({ validateBeforeSave: false });

      req.session.mustResetPassword = true;
      req.session.resetToken = resetToken;

      return res.redirect(`/auth/reset-password/${resetToken}`);
    }
  } catch (error) {
    console.error("Error checking password reset status:", error);
  }

  next();
};
