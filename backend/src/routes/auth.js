const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const { authRequired, JWT_SECRET } = require("../middleware/auth");
const { claimSessionCirculars } = require("../services/circularService");

const router = express.Router();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim() || "";
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}

const JOB_ROLES = ["teacher", "principal", "education_administration"];

function formatUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    jobRole: user.jobRole ?? null,
    district: user.district ?? null,
  };
}

function optionalTrimmed(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, jobRole, district } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    if (!JOB_ROLES.includes(jobRole)) {
      return res.status(400).json({
        error: "Job role is required (teacher, principal, or education_administration)",
      });
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
      jobRole,
      district: optionalTrimmed(district),
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

    if (!user.passwordHash) {
      return res.status(401).json({
        error: "This account uses Google sign-in. Continue with Google instead.",
      });
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

router.post("/google", async (req, res) => {
  try {
    if (!googleClient || !GOOGLE_CLIENT_ID) {
      return res.status(503).json({ error: "Google sign-in is not configured" });
    }

    const { credential } = req.body;
    if (!credential?.trim()) {
      return res.status(400).json({ error: "Google credential is required" });
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ error: "Invalid or expired Google sign-in" });
    }

    const googleId = payload.sub;
    const email = payload.email?.toLowerCase().trim();
    const name = payload.name?.trim() || email?.split("@")[0] || "User";

    if (!googleId || !email) {
      return res.status(400).json({ error: "Google account email is required" });
    }

    if (payload.email_verified === false) {
      return res.status(401).json({ error: "Google email address is not verified" });
    }

    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        if (user.googleId && user.googleId !== googleId) {
          return res.status(409).json({
            error: "This email is linked to a different Google account",
          });
        }
        user.googleId = googleId;
        if (!user.name?.trim()) {
          user.name = name;
        }
        await user.save();
      } else {
        user = await User.create({ name, email, googleId });
      }
    }

    const token = signToken(user);
    res.json({ user: formatUser(user), token });
  } catch (error) {
    console.error("Google auth error:", error.message);
    res.status(500).json({ error: "Could not sign in with Google" });
  }
});

router.get("/me", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name email jobRole district",
    );
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
