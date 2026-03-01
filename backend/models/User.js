/**
 * MongoDB Schema: User
 *
 * Stores off-chain user profile information.
 * The wallet address links the off-chain profile to on-chain identity.
 *
 * What stays OFF-CHAIN (here):
 * - Name, email, role (for UI display and access control)
 *
 * What stays ON-CHAIN (smart contract):
 * - Votes, land ownership, fund releases
 */

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        // Ethereum wallet address (lowercase, unique identifier)
        walletAddress: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            match: /^0x[a-fA-F0-9]{40}$/,
        },

        // Display name
        name: {
            type: String,
            required: true,
            trim: true,
        },

        // Email (optional, for notifications)
        email: {
            type: String,
            trim: true,
            lowercase: true,
        },

        // Role in the system
        role: {
            type: String,
            enum: ["citizen", "admin", "land_officer", "fund_manager"],
            default: "citizen",
        },

        // Aadhaar / ID hash (privacy-preserving: store hash, not raw ID)
        identityHash: {
            type: String,
            default: "",
        },

        // Whether the user has been KYC-verified by admin
        isVerified: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true, // adds createdAt, updatedAt automatically
    }
);

module.exports = mongoose.model("User", userSchema);
