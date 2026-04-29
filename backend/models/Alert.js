const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    nodeName: String,
    ownerName: String,
    sector: String,
    subService: String,
    amount: Number,
    frequency: String,
    expiryDate: Date,
    email: String,
    notes: String,

    lastNotified: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Alert", alertSchema);