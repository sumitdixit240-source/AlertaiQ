const express = require("express");
const router = express.Router();

const OTP = require("../models/OTP");
const Alert = require("../models/Alert"); // ✅ REQUIRED
const sendMail = require("../services/mailer");
const auth = require("../middleware/auth"); // ✅ REQUIRED


// ================= TEST ROUTE =================
router.get("/", auth, (req, res) => {
  res.json({
    success: true,
    message: "Alert route working 🚀",
    user: req.user.id
  });
});


// ================= CREATE ALERT =================
router.post("/create", auth, async (req, res) => {
  try {
    const { title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message required"
      });
    }

    const alert = await Alert.create({
      title,
      message,
      userId: req.user.id   // 🔐 USER ISOLATION
    });

    res.json({
      success: true,
      message: "Alert created",
      data: alert
    });

  } catch (error) {
    console.error("CREATE ALERT ERROR:", error.message);
    res.status(500).json({ success: false });
  }
});


// ================= GET USER ALERTS =================
router.get("/my", auth, async (req, res) => {
  try {
    const alerts = await Alert.find({
      userId: req.user.id   // 🔐 FILTER
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: alerts
    });

  } catch (error) {
    console.error("GET ALERTS ERROR:", error.message);
    res.status(500).json({ success: false });
  }
});


// ================= SEND OTP =================
router.post("/send-otp", auth, async (req, res) => {
  try {
    const email = req.user.email; // 🔐 DO NOT TRUST BODY

    const otp = Math.floor(100000 + Math.random() * 900000);

    await OTP.create({
      email,
      otp,
      userId: req.user.id   // 🔐 LINK TO USER
    });

    await sendMail(
      email,
      "Your OTP",
      `<h1>Your OTP is ${otp}</h1>`
    );

    res.json({ success: true, message: "OTP sent" });

  } catch (error) {
    console.error("SEND OTP ERROR:", error.message);
    res.status(500).json({ success: false });
  }
});


// ================= VERIFY OTP =================
router.post("/verify-otp", auth, async (req, res) => {
  try {
    const { otp } = req.body;

    const record = await OTP.findOne({
      otp,
      userId: req.user.id   // 🔐 STRICT MATCH
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    await OTP.deleteMany({
      userId: req.user.id   // 🔐 CLEAN ONLY USER DATA
    });

    res.json({
      success: true,
      message: "OTP verified"
    });

  } catch (error) {
    console.error("VERIFY OTP ERROR:", error.message);
    res.status(500).json({ success: false });
  }
});


module.exports = router;