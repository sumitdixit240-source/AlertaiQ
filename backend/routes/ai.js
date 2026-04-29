const express = require("express");
const auth = require("../middleware/authMiddleware");
const AiLog = require("../models/AiLog");

const router = express.Router();

// ================= TEST ROUTE =================
router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "AI route working 🚀"
    });
});

// ================= AI GENERATE (SECURED) =================
router.post("/generate", auth, async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: "Prompt is required"
            });
        }

        // ✅ FIX: auth middleware gives ONLY ID (not object)
        const userId = req.user;

        const response = `AI Response for: ${prompt}`;

        await AiLog.create({
            userId,
            prompt,
            response
        });

        res.json({
            success: true,
            response
        });

    } catch (error) {
        console.error("AI Error:", error.message);

        res.status(500).json({
            success: false,
            message: "AI processing failed"
        });
    }
});

// ================= GET USER HISTORY =================
router.get("/history", auth, async (req, res) => {
    try {
        const logs = await AiLog.find({ userId: req.user })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: logs
        });

    } catch (error) {
        console.error("History Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Error fetching history"
        });
    }
});

module.exports = router;
