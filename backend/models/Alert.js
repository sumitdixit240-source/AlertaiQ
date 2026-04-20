const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema({
  userId: String,
  email: String,
  message: String,
  interval: Number,
  nextRun: Date
});

module.exports = mongoose.model("Alert", AlertSchema);
