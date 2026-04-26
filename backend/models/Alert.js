const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    // ================= USER =================
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    // ================= ALERT DATA =================
    category: {
      type: String,
      default: "General",
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      default: 0,
    },

    expiryDate: {
      type: Date,
      required: true,
      index: true,
    },

    // ================= FREQUENCY =================
    frequency: {
      type: String,
      enum: ["one-time", "daily", "weekly", "monthly", "yearly"],
      default: "one-time",
      index: true,
    },

    // ================= CRON OPTIMIZATION =================
    lastSent: {
      type: Date,
      default: null,
    },

    nextRunAt: {
      type: Date,
      default: null,
      index: true,
    },

    // ================= STATUS CONTROL =================
    status: {
      type: String,
      enum: ["active", "paused"],
      default: "active",
      index: true,
    },

    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ================= INDEXES =================
alertSchema.index({ userId: 1, createdAt: -1 });
alertSchema.index({ userId: 1, expiryDate: 1 });
alertSchema.index({ frequency: 1, nextRunAt: 1 });
alertSchema.index({ status: 1, nextRunAt: 1 });

module.exports = mongoose.model("Alert", alertSchema);