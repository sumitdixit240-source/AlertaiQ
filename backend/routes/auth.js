const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const OTP = require("../models/OTP");

const sendMail = require("../services/mailer");
const generateOTP = require("../utils/generateOTP");

const router = express.Router();

// ================= HELPERS =================
const success = (res, message, data = {}) =>
  res.status(200).json({ success: true, message, ...data });

const error = (res, status, message) =>
  res.status(status).json({ success: false, message });

// ================= TOKEN =================
const createToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ================= AUTH RESPONSE =================
const sendAuthResponse = (user, res, message) => {
  const token = createToken(user);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "None",
  });

  return success(res, message, {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
};

// ================= BRANDING =================
const COMPANY_NAME = "AlertAIQ";

// ================= EMAIL TEMPLATE =================
const buildOtpEmail = (name, otp) => {
  return `
  <div style="font-family:Arial;padding:20px;line-height:1.6">
    <h2>${COMPANY_NAME} OTP Verification</h2>

    <p>Dear <b>${name || "User"}</b>,</p>

    <p>Your OTP for verification is:</p>

    <h1 style="color:#4f46e5;letter-spacing:6px">${otp}</h1>

    <p><b>This OTP is valid for 5 minutes only.</b></p>

    <ul>
      <li>Do not share this OTP with anyone</li>
      <li>If you didn’t request this, ignore this email</li>
    </ul>

    <p>— ${COMPANY_NAME} Security System</p>
  </div>
  `;
};

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password)
      return error(res, 400, "All fields required");

    email = email.toLowerCase().trim();

    const exists = await User.findOne({ email });
    if (exists)
      return error(res, 409, "User already exists");

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      isVerified: false,
    });

    // OTP generate
    const otp = generateOTP();

    await OTP.deleteMany({ email });

    await OTP.create({
      email,
      otp,
      createdAt: new Date()
    });

    // send OTP email
    const mailSent = await sendMail(
      email,
      `${COMPANY_NAME} OTP Verification`,
      buildOtpEmail(name, otp)
    );

    if (!mailSent) {
      return error(res, 500, "OTP email failed to send");
    }

    return success(res, "Account created. OTP sent to email.");
  } catch (err) {
    console.error(err);
    return error(res, 500, "Register failed");
  }
});

// ================= SEND OTP =================
router.post("/send-otp", async (req, res) => {
  try {
    let { email } = req.body;

    if (!email)
      return error(res, 400, "Email required");

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });

    const otp = generateOTP();

    await OTP.deleteMany({ email });

    await OTP.create({
      email,
      otp,
      createdAt: new Date()
    });

    const mailSent = await sendMail(
      email,
      `${COMPANY_NAME} OTP Verification`,
      buildOtpEmail(user ? user.name : "User", otp)
    );

    if (!mailSent) {
      return error(res, 500, "Failed to send OTP email");
    }

    return success(res, "OTP sent successfully");
  } catch (err) {
    console.error(err);
    return error(res, 500, "Failed to send OTP");
  }
});

// ================= VERIFY OTP =================
router.post("/verify-otp", async (req, res) => {
  try {
    let { email, otp } = req.body;

    if (!email || !otp)
      return error(res, 400, "Email & OTP required");

    email = email.toLowerCase().trim();

    const record = await OTP.findOne({ email });

    if (!record) {
      return error(res, 400, "OTP expired or not found");
    }

    if (record.otp !== otp) {
      return error(res, 400, "Invalid OTP");
    }

    const user = await User.findOne({ email });

    if (!user)
      return error(res, 404, "User not found");

    user.isVerified = true;
    await user.save();

    await OTP.deleteMany({ email });

    return sendAuthResponse(user, res, "OTP verified successfully");
  } catch (err) {
    console.error(err);
    return error(res, 500, "OTP verification failed");
  }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password)
      return error(res, 400, "Email & password required");

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });

    if (!user)
      return error(res, 404, "User not found");

    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return error(res, 401, "Invalid credentials");

    return sendAuthResponse(user, res, "Login successful");
  } catch (err) {
    console.error(err);
    return error(res, 500, "Login failed");
  }
});

// ================= ME =================
router.get("/me", async (req, res) => {
  try {
    let token =
      req.headers.authorization?.split(" ")[1] ||
      req.cookies?.token;

    if (!token)
      return error(res, 401, "No token");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user)
      return error(res, 404, "User not found");

    return success(res, "User profile", { data: user });
  } catch (err) {
    console.error(err);
    return error(res, 401, "Invalid token");
  }
});

module.exports = router;
