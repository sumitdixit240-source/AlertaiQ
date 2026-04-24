const express = require("express");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const OTP = require("../models/OTP");
const sendMail = require("../services/mailer");
const generateOTP = require("../utils/generateOTP");
const auth = require("../middleware/auth");

const router = express.Router();


// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ✅ CHECK EXISTING USER
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // ✅ CREATE USER
    await User.create({
      name,
      email,
      password,
      isVerified: false
    });

    // ✅ SEND OPTIONAL EMAIL
    await sendMail(
      email,
      "AlertAIQ Account Created",
      `Hi ${name}, your account is created. Please verify OTP.`
    ).catch(() => {});

    res.json({ msg: "Account created successfully" });

  } catch (err) {
    console.error("REGISTER ERROR:", err.message);
    res.status(500).json({ msg: "Registration failed" });
  }
});


// ================= SEND OTP =================
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    const otp = generateOTP();

    // ✅ DELETE OLD OTPs
    await OTP.deleteMany({ email });

    // ✅ SAVE NEW OTP
    await OTP.create({
      email,
      otp,
      createdAt: new Date()
    });

    // ✅ SEND EMAIL
    await sendMail(
      email,
      "AlertAIQ OTP",
      `Your OTP is ${otp}. Valid for 5 minutes.`
    ).catch(() => {});

    res.json({ msg: "OTP sent successfully" });

  } catch (err) {
    console.error("SEND OTP ERROR:", err.message);
    res.status(500).json({ msg: "Failed to send OTP" });
  }
});


// ================= VERIFY OTP =================
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await OTP.findOne({ email });
    if (!record) {
      return res.status(400).json({ msg: "OTP not found" });
    }

    // ✅ CHECK EXPIRY (5 min)
    const expired =
      Date.now() - record.createdAt.getTime() > 5 * 60 * 1000;

    if (expired) {
      await OTP.deleteMany({ email });
      return res.status(400).json({ msg: "OTP expired" });
    }

    // ✅ VERIFY OTP
    if (record.otp !== otp) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    // ✅ MARK VERIFIED
    await User.updateOne({ email }, { isVerified: true });
    await OTP.deleteMany({ email });

    const user = await User.findOne({ email });

    // ✅ GENERATE TOKEN (CRITICAL FOR ISOLATION)
    const token = jwt.sign(
      { id: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      msg: "OTP verified",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error("VERIFY OTP ERROR:", err.message);
    res.status(500).json({ msg: "OTP verification failed" });
  }
});


// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    // ✅ FORCE VERIFICATION
    if (!user.isVerified) {
      return res.status(403).json({ msg: "Verify OTP first" });
    }

    // ✅ PASSWORD CHECK
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Wrong password" });
    }

    // ✅ TRACK LOGIN
    user.lastLogin = new Date();
    await user.save();

    // ✅ TOKEN
    const token = jwt.sign(
      { id: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err.message);
    res.status(500).json({ msg: "Login failed" });
  }
});


// ================= GET CURRENT USER =================
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error("ME ERROR:", err.message);
    res.status(500).json({ msg: "Failed to fetch user" });
  }
});


module.exports = router;