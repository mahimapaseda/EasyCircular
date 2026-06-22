const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { authRequired, JWT_SECRET } = require("../middleware/auth");
const { claimSessionCirculars } = require("../services/circularService");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}

function formatUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
    });

    const token = signToken(user);
    res.status(201).json({ user: formatUser(user), token });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ error: "Could not create account" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken(user);
    res.json({ user: formatUser(user), token });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ error: "Could not sign in" });
  }
});

router.get("/me", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email");
    if (!user) {
      return res.status(404).json({ error: "Account not found" });
    }
    res.json({ user: formatUser(user) });
  } catch (error) {
    console.error("Me error:", error.message);
    res.status(500).json({ error: "Could not load account" });
  }
});

router.post("/claim-session", authRequired, async (req, res) => {
  try {
    const result = await claimSessionCirculars(req.user, req.sessionId);
    res.json(result);
  } catch (error) {
    console.error("Claim session error:", error.message);
    res.status(500).json({ error: "Could not save your circulars to your account" });
  }
});

module.exports = router;
