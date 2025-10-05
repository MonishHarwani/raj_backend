const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { User } = require("../models");
const { authenticateToken } = require("../middleware/auth");
const bcrypt = require("bcryptjs/dist/bcrypt");
const router = express.Router();

// Register
router.post(
  "/register",
  [
    body("firstName")
      .trim()
      .isLength({ min: 2 })
      .withMessage("First name must be at least 2 characters"),
    body("lastName")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Last name must be at least 2 characters"),
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .isIn(["photographer", "hirer"])
      .withMessage("Role must be photographer or hirer"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { firstName, lastName, email, password, role } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "User with this email already exists" });
      }

      // Create user
      const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        role,
      });

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.status(201).json({
        message: "User created successfully",
        token,
        user: user.getPublicProfile(),
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Login
router.post("/login", async (req, res) => {
  try {
    // console.clear();
    console.log("=== BACKEND: Login attempt ===");
    console.log("Request body:", req.body);

    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      console.log("Missing email or password");
      return res.status(400).json({
        message: "Please provide both email and password",
        type: "validation_error",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("Invalid email format");
      return res.status(400).json({
        message: "Please enter a valid email address",
        type: "validation_error",
      });
    }

    // Find user
    const user = await User.findOne({
      where: {
        email: email.toLowerCase().trim(),
      },
    });

    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      console.log("User not found for email:", email);
      return res.status(401).json({
        message:
          "No account found with this email address. Please check your email or sign up for a new account.",
        type: "user_not_found",
      });
    }

    // Check if user is approved (if you have approval system)
    if (user.status === "pending") {
      console.log("User account pending approval");
      return res.status(401).json({
        message:
          "Your account is pending approval. Please wait for admin approval.",
        type: "account_pending",
      });
    }

    if (user.status === "suspended") {
      console.log("User account suspended");
      return res.status(401).json({
        message: "Your account has been suspended. Please contact support.",
        type: "account_suspended",
      });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    console.log("Password valid:", isValid);

    if (!isValid) {
      console.log("Invalid password for user:", user.email);
      return res.status(401).json({
        message:
          "Incorrect password. Please check your password and try again.",
        type: "invalid_password",
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("Login successful for user:", user.email);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto,
        location: user.location,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("=== BACKEND: Login error ===", error);
    res.status(500).json({
      message: "Something went wrong on our end. Please try again in a moment.",
      type: "server_error",
    });
  }
});

// Get current user
router.get("/me", authenticateToken, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Refresh token
router.post("/refresh", authenticateToken, async (req, res) => {
  try {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({ token });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
