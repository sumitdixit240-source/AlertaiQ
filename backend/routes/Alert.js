const mongoose = require("mongoose");

module.exports = mongoose.model("Alert", {
  userId: String,
  service: String,
  amount: Number,
  expiry: Date,
  frequency: String
});