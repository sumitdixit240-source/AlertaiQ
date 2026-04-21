const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");

const errorHandler = require("./middleware/errorMiddleware");

dotenv.config();

const app = express();

// security
app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  credentials: true
}));

// rate limit
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

app.use(express.json());

// routes
app.use("/api/auth", authRoutes);

// health
app.get("/", (req, res) => {
  res.json({ message: "AlertAIQ API Running 🚀" });
});

// error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// start server
connectDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.log("DB error:", err.message);
});
