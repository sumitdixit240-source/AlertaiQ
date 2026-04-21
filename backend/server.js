const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const alertRoutes = require("./routes/alert");
require("./services/cron"); // start scheduler

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/alerts", alertRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`AlertAIQ backend running on port ${PORT}`);
});
