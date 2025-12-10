const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const nodemailer = require("nodemailer");

// ==========================================
// REGISTRATION
// ==========================================

exports.register = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).render("auth/register", {
      errors: errors.array(),
      oldInput: req.body,
    });
  }

  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).render("auth/register", {
        errors: [{ msg: "User with this email or username already exists" }],
        oldInput: req.body,
      });
    }

    const user = new User({ username, email, password });
    await user.save();

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.render("auth/register-success", {
      username: user.username,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).render("auth/register", {
      errors: [{ msg: "Server error during registration. Please try again." }],
      oldInput: req.body,
    });
  }
};

// ==========================================
// LOGIN
// ==========================================

exports.login = async (req, res) => {
  const errors = validationResult(req);
  console.log("Login attempt:", req.body);

  if (!errors.isEmpty()) {
    return res.status(400).render("auth/login", {
      errors: errors.array(),
      oldInput: req.body,
    });
  }

  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).render("auth/login", {
        errors: [{ msg: "Invalid username or password" }],
        oldInput: req.body,
      });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).render("auth/login", {
        errors: [{ msg: "Your account has been blocked. Please contact an administrator." }],
        oldInput: req.body,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).render("auth/login", {
        errors: [{ msg: "Invalid username or password" }],
        oldInput: req.body,
      });
    }

    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.role = user.role;

    // Check if password reset is required
    if (user.requirePasswordReset) {
      // Generate reset token and redirect to password reset page
      const resetToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });

      // Store flags in session so global middleware enforces this on all routes
      req.session.mustResetPassword = true;
      req.session.resetToken = resetToken;
      req.session.success = "You are required to reset your password before continuing.";
      return res.redirect(`/auth/reset-password/${resetToken}`);
    }

    res.redirect("/");
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).render("error", {
      title: "Login Error",
      message: "Server error during login",
    });
  }
};

// ==========================================
// LOGOUT
// ==========================================

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).render("error", {
        title: "Logout Error",
        message: "Unable to logout. Please try again.",
      });
    }
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
};

// ==========================================
// FORGOT PASSWORD — SHOW PAGE
// ==========================================

exports.showForgotPassword = (req, res) => {
  res.render("auth/forgot-password");
};

// ==========================================
// FORGOT PASSWORD — SEND EMAIL
// ==========================================

exports.forgotPassword = async (req, res) => {
  console.log("FORGOT PASSWORD ROUTE HIT");

  const { email } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.render("auth/forgot-password", {
        success: "If that email exists, a reset link has been sent.",
      });
    }

    // Generate token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Build reset URL
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/auth/reset-password/${resetToken}`;

    // Create Gmail transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // TEST CONNECTION
    transporter.verify((err, success) => {
      if (err) console.error("Gmail Login Failed:", err);
      else console.log("Gmail Login Successful!");
    });

    // Send email
    await transporter.sendMail({
      from: `"Showrunner's CMS" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset Request - Showrunner's CMS",
      html: `
        <div style="font-family: Arial; max-width: 600px; margin: auto;">
          <h1 style="color:#44d62c;">Reset Your Password</h1>
          <p>Hello <strong>${user.username}</strong>,</p>
          <p>You requested to reset your password.</p>

          <a href="${resetURL}"
            style="padding:12px 20px; background:#44d62c; color:#000; 
            text-decoration:none; border-radius:5px;">
            Reset Password
          </a>

          <p>If the button doesn't work, use this link:</p>
          <p>${resetURL}</p>
        </div>
      `,
    });

    console.log(`Reset email SENT → ${user.email}`);

    return res.render("auth/forgot-password", {
      success: "Password reset link sent! Check your email.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.render("auth/forgot-password", {
      errors: [{ msg: "Server error. Please try again." }],
      oldInput: { email },
    });
  }
};

// ==========================================
// RESET PASSWORD — SHOW PAGE
// ==========================================

exports.showResetPassword = async (req, res) => {
  try {
    const { token } = req.params;

    const hashed = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.render("auth/forgot-password", {
        errors: [{ msg: "Invalid or expired reset token." }],
      });
    }

    res.render("auth/reset-password", { token });
  } catch (err) {
    console.error("Show reset password error:", err);
    res.render("auth/forgot-password", {
      errors: [{ msg: "Error loading reset page." }],
    });
  }
};

// ==========================================
// RESET PASSWORD — SUBMIT
// ==========================================

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  try {
    if (password !== confirmPassword) {
      return res.render("auth/reset-password", {
        token,
        errors: [{ msg: "Passwords do not match." }],
      });
    }

    if (password.length < 6) {
      return res.render("auth/reset-password", {
        token,
        errors: [{ msg: "Password must be at least 6 characters." }],
      });
    }

    const hashed = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.render("auth/forgot-password", {
        errors: [{ msg: "Invalid or expired reset token." }],
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.requirePasswordReset = false;

    await user.save();

    console.log(`Password reset successful → ${user.username}`);

    // Destroy session to log out the user
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session after password reset:", err);
      }
      res.clearCookie("connect.sid");
      // Render success page with message to log in again
      res.render("auth/reset-success", {
        message: "Your password has been reset successfully. Please log in with your new password.",
      });
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.render("auth/reset-password", {
      token,
      errors: [{ msg: "Error resetting password." }],
    });
  }
};

// ==========================================
// API VERSION (unchanged)
// ==========================================

exports.apiRegister = async (req, res) => {
  /* unchanged */
};
exports.apiLogin = async (req, res) => {
  /* unchanged */
};
exports.apiLogout = async (req, res) => {
  return res.json({ success: true, message: "Logout successful" });
};
