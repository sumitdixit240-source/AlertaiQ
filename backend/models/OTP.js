const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    otp: {
      type: String,
      required: true,
    },

    // ⏱ TTL EXPIRY (5 minutes)
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300, // 5 minutes auto-delete
    },
  },
  {
    timestamps: true,
  }
);

// 🚀 Fast lookup index
otpSchema.index({ email: 1 });

module.exports = mongoose.model("OTP", otpSchema);
