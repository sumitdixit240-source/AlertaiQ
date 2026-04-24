const mongoose = require("mongoose");

const nodeSchema = new mongoose.Schema(
  {
    // ================= USER ISOLATION =================
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      immutable: true
    },

    // ================= CORE DATA =================
    category: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    title: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    // ================= FREQUENCY (NORMALIZED) =================
    // 🔥 Store ONLY backend standard values
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly", "one-time"],
      default: "monthly",
      index: true
    },

    // ================= FINANCIAL =================
    amount: {
      type: Number,
      required: true,
      min: 0
    },

    // ================= TIMING =================
    expiryDate: {
      type: Date,
      required: true,
      index: true
    },

    // ================= AI FEATURE =================
    aiSuggestion: {
      type: String,
      default: ""
    }
  },

  {
    timestamps: true,
    versionKey: false
  }
);


// ================= PERFORMANCE INDEX =================
nodeSchema.index({ userId: 1, createdAt: -1 });
nodeSchema.index({ userId: 1, expiryDate: 1 });


module.exports = mongoose.model("Node", nodeSchema);