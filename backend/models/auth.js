const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ================= HEADER CHECK =================
    if (!authHeader || typeof authHeader !== "string") {
      return res.status(401).json({
        msg: "Authorization header missing"
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        msg: "Invalid authorization format"
      });
    }

    // ================= TOKEN EXTRACT =================
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        msg: "Token not found"
      });
    }

    // ================= VERIFY TOKEN =================
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.id;

    if (!userId) {
      return res.status(401).json({
        msg: "Invalid token payload"
      });
    }

    // ================= ATTACH USER (UPDATED) =================
    req.user = {
      id: decoded.id,
      email: decoded.email || null,
      role: decoded.role || "user",
      tokenVersion: decoded.tokenVersion || 0,
      sessionId: decoded.sessionId || null
    };

    req.token = token; // optional (debugging / logging)

    next();

  } catch (err) {

    // ================= EXPIRED TOKEN =================
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        msg: "Token expired, please login again"
      });
    }

    // ================= INVALID TOKEN =================
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        msg: "Invalid token"
      });
    }

    console.error("AUTH ERROR:", err.message);

    return res.status(500).json({
      msg: "Authentication failed"
    });
  }
};