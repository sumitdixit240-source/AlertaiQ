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
connectDB();

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: "*", // change in production
    credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

// Body Parser
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/payment", paymentRoutes);

// Health Check
app.get("/", (req, res) => {
    res.send("API Running 🚀");
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});