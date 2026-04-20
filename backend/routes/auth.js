const express = require("express");
const router = express.Router();
const OTP = require("../models/otpModel");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

// ✅ OTP GENERATOR
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ✅ EMAIL CONFIG
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// =========================
// 🔥 SEND OTP
// =========================
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({ success: false, message: "Email required" });
    }

    const otp = generateOTP();

    // delete old OTP
    await OTP.deleteMany({ email });

    // save new OTP
    await OTP.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 min
    });

    // send email
    await transporter.sendMail({
      from: `"AlertAIQ" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      html: `<h2>Your OTP is: ${otp}</h2>`
    });

    res.json({ success: true, message: "OTP sent to email" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================
// 🔥 VERIFY OTP + LOGIN
// =========================
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await OTP.findOne({ email });

    if (!record) {
      return res.json({ success: false, message: "OTP not found" });
    }

    if (record.expiresAt < new Date()) {
      return res.json({ success: false, message: "OTP expired" });
    }

    if (record.otp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    // delete OTP after success
    await OTP.deleteOne({ email });

    // create JWT
    const token = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    res.json({
      success: true,
      token,
      user: { email }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
