/**
 * Routes: /api/auth
 *
 * Handles user registration and profile lookup.
 * In a production system you would add JWT authentication;
 * for this college project, wallet-address-based lookup is sufficient.
 */

const express = require("express");
const router = express.Router();
const User = require("../models/User");

/**
 * POST /api/auth/register
 * Body: { walletAddress, name, email?, role? }
 *
 * Registers a new user (links wallet address to a profile).
 */
router.post("/register", async (req, res) => {
    try {
        const { walletAddress, name, email, role } = req.body;

        if (!walletAddress || !name) {
            return res.status(400).json({ error: "walletAddress and name are required" });
        }

        // Check if already registered
        const existing = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
        if (existing) {
            return res.status(409).json({ error: "Wallet already registered", user: existing });
        }

        const user = new User({
            walletAddress: walletAddress.toLowerCase(),
            name,
            email: email || "",
            role: role || "citizen",
        });

        await user.save();
        res.status(201).json({ message: "User registered", user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * GET /api/auth/profile/:walletAddress
 *
 * Look up a user profile by wallet address.
 */
router.get("/profile/:walletAddress", async (req, res) => {
    try {
        const user = await User.findOne({
            walletAddress: req.params.walletAddress.toLowerCase(),
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * GET /api/auth/users
 *
 * List all registered users (admin use).
 */
router.get("/users", async (_req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json({ users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
