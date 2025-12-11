/******************************************************************************
 * ITE5315 – Project
 * I declare that this project is my own work in accordance with Humber Academic Policy.
 * No part of this project has been copied manually or electronically from any other source
 * (including web sites) or distributed to other students.
 * Group Member Names: Ariunjargal Erdenebaatar, Samuel Law, Scarlett Jet
 * Student IDs: N01721372, N01699541, N01675129
 * Date: 2025/12/10
 ******************************************************************************/
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  created: {
    type: Date,
    default: Date.now,
  },
  // Password reset fields
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  // Admin management fields
  isBlocked: {
    type: Boolean,
    default: false,
  },
  requirePasswordReset: {
    type: Boolean,
    default: false,
  },
});

/* 
=========================================
 FIXED PASSWORD HASHING HOOK
=========================================
 This hook is async with NO next() argument.
 Mongoose handles resolution automatically.
 No more "next is not a function" errors.
*/
userSchema.pre("save", async function () {
  // Only hash if password was modified
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function () {
  // Generate random token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set token expiration (1 hour from now)
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour

  // Return unhashed token (to send in email)
  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
