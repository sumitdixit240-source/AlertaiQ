import express from "express";
import auth from "../middleware/auth.js";        // 🔐 JWT middleware
import AiLog from "../models/AiLog.js";          // 💾 Model to store per-user data

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

        // 🔐 Get logged-in user ID
        const userId = req.user.id;

        // 🤖 Fake AI response (replace later with real AI)
        const response = `AI Response for: ${prompt}`;

        // 💾 Save data with userId (THIS IS USER ISOLATION)
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
        const logs = await AiLog.find({ userId: req.user.id })
                               .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: logs
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching history"
        });
    }
});

export default router;