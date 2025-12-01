const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");

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

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Set session
    req.session.userId = user._id;
    req.session.username = user.username;

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

// Logout user (Samuel's task - placeholder)
exports.logout = (req, res) => {
  // Samuel will implement this
  res.status(501).send("Logout not implemented yet");
};
