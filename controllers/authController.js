const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { validationResult } = require("express-validator");

// ==========================================
// REGISTRATION
// ==========================================

// Register new user (Scarlett's task)
exports.register = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    // Create new user (password will be hashed automatically by User model)
    const user = new User({
      username,
      email,
      password,
    });

    await user.save();

    // Create JWT token (but don't set session)
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
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// ==========================================
// LOGIN
// ==========================================

// Login user (Ari's task)
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

    // Find user ONLY by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).render("auth/login", {
        errors: [{ msg: "Invalid username or password" }],
        oldInput: req.body,
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).render("auth/login", {
        errors: [{ msg: "Invalid username or password" }],
        oldInput: req.body,
      });
    }

    // Set session
    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.role = user.role;

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

// Logout user (Samuel)
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).render("error", {
        title: "Logout Error",
        message: "Unable to logout. Please try again.",
      });
    }
    // Clear the session cookie
    res.clearCookie("connect.sid");
    // Redirect to home page
    res.redirect("/");
  });
};

// ==========================================
// PASSWORD RESET
// ==========================================

// SHOW FORGOT PASSWORD FORM
exports.showForgotPassword = (req, res) => {
  res.render("auth/forgot-password");
};

// HANDLE FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if email exists or not (security best practice)
      return res.render("auth/forgot-password", {
        success: "If that email exists, a reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/auth/reset-password/${resetToken}`;

    // FOR DEVELOPMENT: Just log the URL
    console.log("\n🔐 PASSWORD RESET LINK 🔐");
    console.log("================================");
    console.log(`User: ${user.username} (${user.email})`);
    console.log(`Reset URL: ${resetURL}`);
    console.log("================================\n");

    // TODO: Send actual email here
    // Example with nodemailer:
    /*
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Request - Showrunner\'s CMS',
      html: `
        <h1>Reset Your Password</h1>
        <p>Hi ${user.username},</p>
        <p>You requested to reset your password. Click the link below:</p>
        <a href="${resetURL}">${resetURL}</a>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });
    */

    res.render("auth/forgot-password", {
      success:
        "Password reset link sent! Check your email (or console for development).",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    // Clear reset token if error occurs
    if (user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
    }

    res.render("auth/forgot-password", {
      errors: [{ msg: "Error sending reset email. Please try again." }],
      oldInput: { email },
    });
  }
};

// SHOW RESET PASSWORD FORM
exports.showResetPassword = async (req, res) => {
  try {
    const { token } = req.params;

    // Hash the token from URL to compare with database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.render("auth/forgot-password", {
        errors: [
          { msg: "Invalid or expired reset token. Please request a new one." },
        ],
      });
    }

    res.render("auth/reset-password", { token });
  } catch (error) {
    console.error("Show reset password error:", error);
    res.render("auth/forgot-password", {
      errors: [{ msg: "Error loading reset page. Please try again." }],
    });
  }
};

// HANDLE RESET PASSWORD
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  try {
    // Validate passwords match
    if (password !== confirmPassword) {
      return res.render("auth/reset-password", {
        token,
        errors: [{ msg: "Passwords do not match." }],
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.render("auth/reset-password", {
        token,
        errors: [{ msg: "Password must be at least 6 characters." }],
      });
    }

    // Hash the token from URL
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.render("auth/forgot-password", {
        errors: [
          { msg: "Invalid or expired reset token. Please request a new one." },
        ],
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log(`✅ Password reset successful for user: ${user.username}`);

    // Render success page
    res.render("auth/reset-success");
  } catch (error) {
    console.error("Reset password error:", error);
    res.render("auth/reset-password", {
      token,
      errors: [{ msg: "Error resetting password. Please try again." }],
    });
  }
};

// ==========================================
// API ROUTES
// ==========================================

// API Registration
exports.apiRegister = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    // Create new user (password will be hashed automatically by User model)
    const user = new User({
      username,
      email,
      password,
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// API Login
exports.apiLogin = async (req, res) => {
  const errors = validationResult(req);
  console.log("API Login attempt:", req.body);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  try {
    const { username, password } = req.body;

    // Find user ONLY by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("API Login error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error during API login" });
  }
};

// API Logout
exports.apiLogout = async (req, res) => {
  return res.json({
    success: true,
    message: "Logout successful - delete token on client side",
  });
};
