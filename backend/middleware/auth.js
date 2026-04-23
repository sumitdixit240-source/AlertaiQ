const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ================= TOKEN CHECK =================
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

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        msg: "Token not found"
      });
    }

    // ================= VERIFY TOKEN =================
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({
        msg: "Invalid token"
      });
    }

    // ================= SAFE USER EXTRACTION =================
    const userId = decoded.id || decoded._id;

    if (!userId) {
      return res.status(401).json({
        msg: "Token payload missing user id"
      });
    }

    // ================= ATTACH USER =================
    req.user = {
      id: userId,
      email: decoded.email || null
    };

    // store token for audit/logging if needed
    req.token = token;

    next();

  } catch (err) {

    // ================= EXPIRED TOKEN =================
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        msg: "Token expired, please login again"
      });
    }

    // ================= JWT ERROR =================
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        msg: "Invalid token signature"
      });
    }

    // ================= FALLBACK ERROR =================
    return res.status(500).json({
      msg: "Authentication failed"
    });
  }
};