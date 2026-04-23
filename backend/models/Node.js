const mongoose = require("mongoose");

const nodeSchema = new mongoose.Schema(
  {
    // 🔒 USER OWNERSHIP (SECURE ISOLATION)
    userId: {
      type: String,
      required: true,
      index: true // ⚡ faster queries per user
    },

    // ================= CORE FIELDS =================
    cat: {
      type: String,
      required: true,
      trim: true
    },

    sub: {
      type: String,
      required: true,
      trim: true
    },

    freq: {
      type: String,
      required: true,
      enum: ["daily", "weekly", "monthly", "yearly", "one-time"],
      default: "monthly"
    },

    amt: {
      type: Number,
      required: true,
      min: 0
    },

    expiry: {
      type: Date,
      required: false
    },

    // ================= AUTO TIMESTAMP =================
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },

  {
    versionKey: false // removes __v (clean production DB)
  }
);

module.exports = mongoose.model("Node", nodeSchema);
