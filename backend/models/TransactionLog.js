/**
 * MongoDB Schema: TransactionLog
 *
 * Mirrors blockchain transaction hashes in MongoDB for easy searching and display.
 * The blockchain is the source of truth; this is a convenience index.
 *
 * Example: after a user votes on-chain, the frontend POSTs the tx hash here
 * so the backend can display a transaction history without querying the chain.
 */

const mongoose = require("mongoose");

const transactionLogSchema = new mongoose.Schema(
    {
        // Ethereum transaction hash
        txHash: {
            type: String,
            required: true,
            unique: true,
        },

        // Which module this transaction belongs to
        module: {
            type: String,
            enum: ["voting", "land", "funds", "identity"],
            required: true,
        },

        // Wallet address that initiated the transaction
        fromAddress: {
            type: String,
            required: true,
            lowercase: true,
        },

        // Human-readable description
        description: {
            type: String,
            default: "",
        },

        // Block number (if known)
        blockNumber: {
            type: Number,
            default: null,
        },

        // Status
        status: {
            type: String,
            enum: ["pending", "confirmed", "failed"],
            default: "pending",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("TransactionLog", transactionLogSchema);
