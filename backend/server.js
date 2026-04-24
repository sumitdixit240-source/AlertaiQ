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

const app = express();
const server = http.createServer(app);

// ================= ALLOWED ORIGINS =================
const allowedOrigins = [
  "http://localhost:5000",
  "https://alertai-q.vercel.app"
];

// ================= SOCKET.IO =================
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// make io available in routes
app.set("io", io);

// ================= SOCKET EVENTS =================
io.on("connection", (socket) => {
  console.log(`[${new Date().toISOString()}] ⚡ User connected: ${socket.id}`);

  socket.on("nodeUpdated", (data) => {
    io.emit("refreshNodes", data);
  });

  socket.on("newAlert", (data) => {
    io.emit("refreshAlerts", data);
  });

  socket.on("disconnect", () => {
    console.log(`[${new Date().toISOString()}] ❌ User disconnected: ${socket.id}`);
  });
});

// ================= SECURITY =================
app.use(helmet());

// ================= CORS =================
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("❌ Blocked CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

// ================= RATE LIMIT =================
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100
}));

// ================= BODY =================
app.use(express.json());

// ================= REQUEST LOG (optional) =================
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/nodes", nodeRoutes);
app.use("/api/alerts", alertRoutes); // ✅ fixed naming

// ================= HEALTH =================
app.get("/", (req, res) => {
  res.json({ status: "Server Running ✅" });
});

// ================= 404 =================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({
    message: err.message || "Internal Server Error"
  });
});

// ================= START SERVER =================
async function startServer() {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    if (!process.env.PORT) {
      console.warn("⚠️ PORT not set in .env, using default 5000");
    }

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
