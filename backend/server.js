const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Cron job (optional safe load)
try {
  require("./jobs/cron");
} catch (err) {
  console.log("Cron not loaded");
}

const app = express();

// ---------------- MIDDLEWARE ----------------
app.use(cors());
app.use(express.json());

// ---------------- DATABASE ----------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("DB Connected"))
  .catch(err => console.log("DB Error:", err));

// ---------------- ROUTES ----------------

// ALL routes MUST export express.Router()

const authRoute = require("./routes/auth");
const paymentRoute = require("./routes/payment");
const alertRoute = require("./routes/alert");
const aiRoute = require("./routes/ai");
const userRoute = require("./routes/User");

// ⚠️ FIX: DO NOT use services or models in app.use
// REMOVE these:
// const mailerRoute = require("./services/mailer"); ❌
// const otpRoute = require("./models/OTP"); ❌

// OPTIONAL route (safe load)
let razorpayRoute;
try {
  razorpayRoute = require("./routes/razorpay");
} catch (e) {
  console.log("Razorpay route missing - skipping");
}

// ---------------- USE ROUTES ----------------
app.use("/api/auth", authRoute);
app.use("/api/payment", paymentRoute);
app.use("/api/alerts", alertRoute);
app.use("/api/ai", aiRoute);
app.use("/api/user", userRoute);

// Optional route
if (razorpayRoute) {
  app.use("/api/razorpay", razorpayRoute);
}

// ---------------- TEST ROUTE ----------------
app.get("/", (req, res) => {
  res.send("AlertAIQ Backend Running 🚀");
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
