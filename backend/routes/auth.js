const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const OTP = require("../models/OTP");
const sendMail = require("../services/mailer");
const generateOTP = require("../utils/generateOTP");

const router = express.Router();


// REGISTER
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  await User.create({ name, email, password: hash });

  res.json({ msg: "Account created successfully" });
});


// SEND OTP
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  const otp = generateOTP();

  await OTP.create({ email, otp });

  await sendMail(email, "AlertAIQ OTP", `Your OTP is ${otp}`);

  res.json({ msg: "OTP sent" });
});


// LOGIN PASSWORD
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ msg: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ msg: "Wrong password" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  res.json({ token, user });
});


// LOGIN OTP VERIFY
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  const record = await OTP.findOne({ email, otp });
  if (!record) return res.status(400).json({ msg: "Invalid OTP" });

  const user = await User.findOne({ email });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  res.json({ token, user });
});

module.exports = router;
