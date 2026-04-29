const mongoose = require("mongoose");

const nodeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  name: String,
  owner: String,
  amount: Number,
  sector: String,
  subService: String,
  frequency: String,
  expiry: Date,
  email: String,
  notes: String,

  lastAlertSent: Date
}, { timestamps: true });

module.exports = mongoose.model("Node", nodeSchema);