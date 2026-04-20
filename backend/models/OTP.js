const mongoose = require("mongoose");

module.exports = mongoose.model("OTP", {
  email: String,
  otp: String,
  createdAt: { type: Date, default: Date.now, expires: 300 }
});