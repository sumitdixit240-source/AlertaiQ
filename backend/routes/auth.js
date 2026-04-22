const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const OTP = require("../models/OTP");

const sendMail = require("../services/mailer");
const generateOTP = require("../utils/generateOTP");

const router = express.Router();


// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ✅ HERE (User.findOne used correctly)
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ msg: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      isVerified: false
    });

    await sendMail(
      email,
      "AlertAIQ Account Created",
      `Welcome ${name}, your account has been created successfully. Please verify OTP.`
    );

    res.json({ msg: "Account created", user });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


// ================= SEND OTP =================
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    // ✅ HERE (User.findOne used correctly)
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ msg: "User not found" });

    const otp = generateOTP();

    await OTP.deleteMany({ email });

    await OTP.create({
      email,
      otp,
      createdAt: new Date()
    });

    await sendMail(
      email,
      "AlertAIQ OTP Verification",
      `Your OTP is: ${otp}. It is valid for 5 minutes.`
    );

    res.json({ msg: "OTP sent successfully" });

  } catch (err) {
    console.log("OTP ERROR:", err);
    res.status(500).json({ msg: "Failed to send OTP" });
  }
});


// ================= VERIFY OTP =================
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await OTP.findOne({ email, otp });

    if (!record)
      return res.status(400).json({ msg: "Invalid or expired OTP" });

    await User.updateOne(
      { email },
      { isVerified: true }
    );

    await OTP.deleteMany({ email });

    res.json({ msg: "OTP verified successfully" });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ HERE (User.findOne used correctly)
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ msg: "User not found" });

    if (!user.isVerified) {
      return res.status(403).json({ msg: "Verify OTP first" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ msg: "Wrong password" });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
