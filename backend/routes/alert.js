const express = require("express");
const router = express.Router();

const Alert = require("../models/Alert");
const OTP = require("../models/OTP");
const sendMail = require("../services/mailer");
const auth = require("../middleware/auth");


// ================= TEST ROUTE =================
router.get("/", auth, (req, res) => {
  res.json({
    success: true,
    message: "Alert route working 🚀",
    user: req.user.id
  });
});


// ================= CREATE ALERT =================
// supports: /create AND /add
router.post(["/create", "/add"], auth, async (req, res) => {
  try {
    const { title, message, description } = req.body;

    if (!title && !message && !description) {
      return res.status(400).json({
        success: false,
        message: "Title or message required"
      });
    }

    const alert = await Alert.create({
      userId: req.user.id, // 🔐 IMPORTANT: USER ISOLATION
      title: title || "No Title",
      message: message || description || ""
    });

    res.json({
      success: true,
      message: "Alert created",
      data: alert
    });

  } catch (err) {
    console.error("CREATE ALERT ERROR:", err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


// ================= GET USER ALERTS =================
// supports: /my AND /all (multi-device sync)
router.get(["/my", "/all"], auth, async (req, res) => {
  try {
    const alerts = await Alert.find({
      userId: req.user.id
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: alerts
    });

  } catch (err) {
    console.error("GET ALERTS ERROR:", err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


// ================= SEND OTP =================
router.post("/send-otp", auth, async (req, res) => {
  try {
    const email = req.user.email; // from JWT only (secure)

    const otp = Math.floor(100000 + Math.random() * 900000);

    await OTP.create({
      email,
      otp,
      userId: req.user.id
    });

    await sendMail(email, "Your OTP", `<h1>Your OTP is ${otp}</h1>`);

    res.json({
      success: true,
      message: "OTP sent"
    });

  } catch (err) {
    console.error("SEND OTP ERROR:", err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


// ================= VERIFY OTP =================
router.post("/verify-otp", auth, async (req, res) => {
  try {
    const { otp } = req.body;

    const record = await OTP.findOne({
      otp,
      userId: req.user.id
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    await OTP.deleteMany({
      userId: req.user.id
    });

    res.json({
      success: true,
      message: "OTP verified"
    });

  } catch (err) {
    console.error("VERIFY OTP ERROR:", err.message);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


module.exports = router;