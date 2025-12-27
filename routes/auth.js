const express = require("express");
const User = require("../models/User");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// Register user
router.post("/register", async (req, res) => {
  try {
    const { name, email, photoURL, firebaseUID } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { firebaseUID }],
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({
      name,
      email,
      photoURL,
      firebaseUID,
      role: "member",
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
});

// Get current user
router.get("/me", verifyToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        photoURL: req.user.photoURL,
        role: req.user.role,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Failed to get user data" });
  }
});

module.exports = router;
