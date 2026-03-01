/**
 * Routes: /api/transactions
 *
 * Logs blockchain transactions off-chain for easy querying.
 * After a user sends an on-chain transaction (vote, land transfer, fund release),
 * the frontend POSTs the tx hash here for indexing.
 */

const express = require("express");
const router = express.Router();
const TransactionLog = require("../models/TransactionLog");

/**
 * POST /api/transactions
 * Body: { txHash, module, fromAddress, description?, blockNumber? }
 *
 * Log a new transaction.
 */
router.post("/", async (req, res) => {
    try {
        const { txHash, module, fromAddress, description, blockNumber } = req.body;

        if (!txHash || !module || !fromAddress) {
            return res.status(400).json({ error: "txHash, module, and fromAddress are required" });
        }

        const log = new TransactionLog({
            txHash,
            module,
            fromAddress: fromAddress.toLowerCase(),
            description: description || "",
            blockNumber: blockNumber || null,
            status: "confirmed",
        });

        await log.save();
        res.status(201).json({ message: "Transaction logged", log });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: "Transaction already logged" });
        }
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * GET /api/transactions
 * Query params: ?module=voting&fromAddress=0x...
 *
 * Retrieve transaction logs with optional filters.
 */
router.get("/", async (req, res) => {
    try {
        const filter = {};
        if (req.query.module) filter.module = req.query.module;
        if (req.query.fromAddress) filter.fromAddress = req.query.fromAddress.toLowerCase();

        const logs = await TransactionLog.find(filter).sort({ createdAt: -1 }).limit(100);
        res.json({ logs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * GET /api/transactions/:txHash
 *
 * Look up a single transaction log by hash.
 */
router.get("/:txHash", async (req, res) => {
    try {
        const log = await TransactionLog.findOne({ txHash: req.params.txHash });
        if (!log) {
            return res.status(404).json({ error: "Transaction not found" });
        }
        res.json({ log });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
