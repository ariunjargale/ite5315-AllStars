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

// API calls
// Register
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

// Login
exports.apiLogin = async (req, res) => {
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
    console.error("Login error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error during API login" });
  }
};

// Logout
exports.apiLogout = async (req, res) => {
  return res.json({
    success: true,
    message: "Logout successful - delete token on client side",
  });
};
