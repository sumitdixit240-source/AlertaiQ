const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const nodeRoutes = require("./routes/nodes");
const alertRoutes = require("./routes/alert");

dotenv.config();

// ================= APP + SERVER =================
const app = express();
const server = http.createServer(app);

// ================= ALLOWED ORIGINS =================
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:5500",
  "https://alertai-q.vercel.app"
];

// ================= SOCKET.IO =================
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.set("io", io);

// ================= SOCKET EVENTS =================
io.on("connection", (socket) => {
  console.log(`⚡ User connected: ${socket.id}`);

  socket.on("nodeUpdated", (data) => {
    io.emit("refreshNodes", data);
  });

  socket.on("newAlert", (data) => {
    io.emit("refreshAlerts", data);
  });

  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// ================= SECURITY =================
app.use(helmet());

// ================= CORS (FINAL FIX) =================
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("❌ CORS Blocked:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// ================= RATE LIMIT =================
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
  })
);

// ================= BODY PARSER =================
app.use(express.json());

// ================= REQUEST LOG =================
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/nodes", nodeRoutes);
app.use("/api/alerts", alertRoutes);

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.json({ status: "🚀 AlertAIQ Server Running" });
});

// ================= 404 HANDLER =================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  res.status(500).json({
    message: err.message || "Internal Server Error"
  });
});

// ================= DATABASE + SERVER START =================
async function startServer() {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log("⚡ Socket.IO enabled");
    });
  } catch (err) {
    console.error("❌ DB ERROR:", err.message);
    process.exit(1);
  }
}

startServer();
