const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());

/* =========================
   DATABASE CONNECTION
========================= */
connectDB(); 
// fallback safety (optional if connectDB already handles logs)
mongoose.connection.on("connected", () => {
  console.log("DB Connected (mongoose event)");
});

mongoose.connection.on("error", (err) => {
  console.log("DB Connection Error:", err);
});

/* =========================
   ROUTES
========================= */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/alerts", require("./routes/alert"));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/user", require("./routes/User"));

/* =========================
   HEALTH CHECK ROUTE
========================= */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AlertAIQ Backend Running 🚀",
    timestamp: new Date()
  });
});

/* =========================
   GLOBAL ERROR HANDLER (SAFE)
========================= */
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
