const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const OTP = require("../models/OTP");

const sendMail = require("../services/mailer");
const generateOTP = require("../utils/generateOTP");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

//
// ================= RESPONSE HELPERS =================
//
const success = (res, message, data = {}) => {
  return res.status(200).json({
    success: true,
    message,
    ...data,
  });
};

const error = (res, status, message) => {
  return res.status(status).json({
    success: false,
    message,
  });
};

//
// ================= TOKEN =================
//
const createToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

//
// ================= AUTH RESPONSE =================
//
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

//
// ================= OTP EMAIL TEMPLATE (PROFESSIONAL) =================
//
const buildOtpEmail = (otp) => {
  return `
  <div style="font-family:Arial; padding:20px; color:#222; line-height:1.6">

    <h2>AlertAIQ Account Verification</h2>

    <p>Dear User,</p>

    <p>
      To complete your registration, please use the One-Time Password (OTP) below to verify your email address.
    </p>

    <h1 style="color:#1a73e8; letter-spacing:2px">${otp}</h1>

    <p><b>Important Security Information:</b></p>
    <ul>
      <li>This OTP is valid for 5 minutes only</li>
      <li>Do not share this code with anyone</li>
      <li>AlertAIQ will never request your OTP via phone or email</li>
      <li>Use this code only on the official AlertAIQ platform</li>
      <li>If you did not request this, ignore this email</li>
    </ul>

    <hr/>

    <p style="font-size:13px; color:gray">
      AlertAIQ is an AI-powered digital intelligence platform designed to enhance security,
      automate monitoring, and provide real-time alerts for users and businesses. We ensure
      data privacy, encrypted communication, and intelligent risk detection to protect your
      digital ecosystem. Our mission is to deliver a secure, smart, and seamless experience
      across all financial and digital interactions.
    </p>

  </div>
  `;
};

//
// ================= REGISTER (PROFESSIONAL RESPONSE) =================
//
router.post("/register", async (req, res) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password)
      return error(res, 400, "All fields are required.");

    email = email.toLowerCase().trim();

    const exists = await User.findOne({ email });
    if (exists)
      return error(res, 409, "An account with this email already exists.");

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashed,
      isVerified: false,
    });

    // ================= OTP =================
    const otp = generateOTP();

    await OTP.deleteMany({ email });
    await OTP.create({ email, otp });

    const sent = await sendMail(
      email,
      "AlertAIQ - Email Verification OTP",
      buildOtpEmail(otp)
    );

    if (!sent) {
      return error(res, 500, "Account created but OTP email delivery failed.");
    }

    // ================= PROFESSIONAL FRONTEND MESSAGE =================
    return success(
      res,
      `Registration successful. A verification OTP has been sent to your registered email address.

Your AlertAIQ account has been securely created and is currently pending verification. To activate your account and access all features, please verify your email using the OTP sent to your inbox.

✔ Step 1: Account created successfully and securely stored  
✔ Step 2: Email verification is required to activate services  

AlertAIQ uses advanced encryption, AI-driven monitoring, and secure authentication protocols to ensure complete protection of your data and digital activities.`
    );

  } catch (err) {
    console.error(err);
    return error(res, 500, "Registration failed. Please try again later.");
  }
});

//
// ================= VERIFY OTP =================
//
router.post("/verify-otp", async (req, res) => {
  try {
    let { email, otp } = req.body;

    if (!email || !otp)
      return error(res, 400, "Email and OTP are required.");

    email = email.toLowerCase().trim();

    const record = await OTP.findOne({ email });

    if (!record || record.otp != otp)
      return error(res, 400, "Invalid or expired OTP.");

    await User.updateOne({ email }, { isVerified: true });
    await OTP.deleteMany({ email });

    const user = await User.findOne({ email });

    return sendAuthResponse(
      user,
      res,
      "Email verification successful. Welcome to AlertAIQ."
    );

  } catch (err) {
    console.error(err);
    return error(res, 500, "OTP verification failed.");
  }
});

module.exports = router;
