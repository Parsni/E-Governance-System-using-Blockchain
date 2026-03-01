/**
 * MongoDB Schema: LandRecord
 *
 * Stores supplemental land record metadata OFF-CHAIN.
 * The smart contract stores: owner, location, area, documentHash, isVerified.
 * This schema stores: additional descriptions, images, GPS coordinates, etc.
 *
 * The on-chain parcelId is used as the linking key.
 */

const mongoose = require("mongoose");

const landRecordSchema = new mongoose.Schema(
    {
        // Links to on-chain parcel ID
        parcelId: {
            type: Number,
            required: true,
            unique: true,
        },

        // Detailed address (more than what's stored on-chain)
        fullAddress: {
            type: String,
            default: "",
        },

        // GPS coordinates
        latitude: {
            type: Number,
            default: null,
        },
        longitude: {
            type: Number,
            default: null,
        },

        // Property type
        propertyType: {
            type: String,
            enum: ["residential", "commercial", "agricultural", "industrial", "other"],
            default: "other",
        },

        // Market value estimate (off-chain, for display only)
        estimatedValue: {
            type: Number,
            default: 0,
        },

        // URLs to property photos (could be IPFS URLs)
        photoUrls: {
            type: [String],
            default: [],
        },

        // Notes added by land officer
        officerNotes: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("LandRecord", landRecordSchema);
