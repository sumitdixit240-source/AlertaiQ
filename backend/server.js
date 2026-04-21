import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.js";
import alertRoutes from "./routes/alert.js";
import aiRoutes from "./routes/ai.js";
import paymentRoutes from "./routes/payment.js";

import errorHandler from "./middleware/errorMiddleware.js";

dotenv.config();

// ❗ Safe DB connection (prevents Render crash)
connectDB().catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
});

const app = express();

// ================= SECURITY =================
app.use(helmet());

app.use(cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true
}));

// ================= RATE LIMIT =================
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
});
app.use(limiter);

// ================= BODY PARSER =================
app.use(express.json({ limit: "10kb" }));

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/payment", paymentRoutes);

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
    res.status(200).json({
        status: "success",
        message: "AlertAIQ API Running 🚀"
    });
});

// ================= ERROR HANDLER =================
app.use(errorHandler);

// ================= SERVER START =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// ================= GLOBAL CRASH HANDLING =================
process.on("unhandledRejection", (err) => {
    console.error("❌ Unhandled Rejection:", err.message);
    server.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
    console.error("❌ Uncaught Exception:", err.message);
    process.exit(1);
});
