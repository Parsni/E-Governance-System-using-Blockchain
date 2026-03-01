/**
 * Express server entry point for the E-Governance backend.
 *
 * This backend serves as the OFF-CHAIN layer:
 * - Stores user profiles (MongoDB)
 * - Logs blockchain transaction hashes for easy querying
 * - Stores supplemental land record metadata
 *
 * The BLOCKCHAIN remains the source of truth for votes, land ownership, and funds.
 * This backend is a convenience layer for search, analytics, and user management.
 */

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const transactionRoutes = require("./routes/transactions");

const app = express();

// ── Middleware ──────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json());

// ── MongoDB Connection ─────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/egovernance";

mongoose
    .connect(MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB:", MONGO_URI))
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err.message);
        process.exit(1);
    });

// ── Routes ─────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);

// ── Health Check ───────────────────────────────────────
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Start ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});
