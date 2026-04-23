const mongoose = require("mongoose");

const nodeSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  cat: String,
  sub: String,
  freq: String,
  amt: Number,
  expiry: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Node", nodeSchema);
