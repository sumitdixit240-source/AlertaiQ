const express = require("express");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const OTP = require("../models/OTP");
const sendMail = require("../services/mailer");
const generateOTP = require("../utils/generateOTP");
const auth = require("../middleware/auth");

const router = express.Router();

// ================= TOKEN =================
const createToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ================= RESPONSE FORMAT (IMPORTANT FOR FRONTEND) =================
const sendAuthResponse = (user, res, msg = "Success") => {
  const token = createToken(user);

  return res.json({
    success: true,
    message: msg,
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
};

//
// ================= REGISTER =================
//
router.post("/register", async (req, res) => {
  try {
    let { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    email = email.toLowerCase().trim();

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ success: false, message: "User already exists" });
    }

    await User.create({
      name,
      email,
      password,
      role: "user",
      tokenVersion: 0,
    });

    return res.json({
      success: true,
      message: "Registered successfully. Verify OTP to continue.",
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ success: false, message: "Registration failed" });
  }
});

//
// ================= SEND OTP =================
//
router.post("/send-otp", async (req, res) => {
  try {
    let { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ success: false, message: "Email required" });
    }

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const recent = await OTP.findOne({ email });

    if (recent && Date.now() - new Date(recent.createdAt).getTime() < 60000) {
      return res.status(429).json({
        success: false,
        message: "Wait 60 seconds before requesting OTP again",
      });
    }

    const otp = generateOTP();

    await OTP.deleteMany({ email });
    await OTP.create({ email, otp });

    await sendMail(
      email,
      "Core.AI OTP Verification",
      `<h2>Your OTP is: <b>${otp}</b></h2>`
    );

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (err) {
    console.error("OTP ERROR:", err);
    return res.status(500).json({ success: false, message: "OTP failed" });
  }
});

//
// ================= VERIFY OTP =================
//
router.post("/verify-otp", async (req, res) => {
  try {
    let { email, otp } = req.body || {};

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    email = email.toLowerCase().trim();

    const record = await OTP.findOne({ email });
    if (!record) {
      return res.status(400).json({ success: false, message: "OTP not found" });
    }

    if (Date.now() - new Date(record.createdAt).getTime() > 5 * 60 * 1000) {
      await OTP.deleteMany({ email });
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    await User.updateOne({ email }, { isVerified: true });
    await OTP.deleteMany({ email });

    const user = await User.findOne({ email });

    return sendAuthResponse(user, res, "OTP verified");

  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    return res.status(500).json({ success: false, message: "Verification failed" });
  }
});

//
// ================= LOGIN =================
//
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: "Verify OTP first" });
    }

    const ok = await user.comparePassword(password);

    if (!ok) {
      return res.status(400).json({ success: false, message: "Invalid password" });
    }

    return sendAuthResponse(user, res, "Login successful");

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ success: false, message: "Login failed" });
  }
});

//
// ================= ME =================
//
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    return res.json({
      success: true,
      data: user,
    });

  } catch (err) {
    console.error("ME ERROR:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
});

//
// ================= LOGOUT ALL DEVICES =================
// (IMPORTANT FOR DASHBOARD SECURITY)
//
router.post("/logout-all", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.tokenVersion += 1;
    await user.save();

    return res.json({
      success: true,
      message: "Logged out from all devices",
    });

  } catch (err) {
    console.error("LOGOUT ERROR:", err);
    return res.status(500).json({ success: false, message: "Logout failed" });
  }
});

module.exports = router;
