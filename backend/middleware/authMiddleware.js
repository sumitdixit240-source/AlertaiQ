const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    let token = req.headers.authorization;

    // ✅ Check token exists
    if (!token) {
      return res.status(401).json({ msg: "No token, access denied" });
    }

    // ✅ Handle "Bearer <token>" format
    if (token.startsWith("Bearer ")) {
      token = token.split(" ")[1];
    }

    // ❌ Extra safety check
    if (!token) {
      return res.status(401).json({ msg: "Invalid token format" });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // attach user id to request
    req.user = decoded.id;

    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);

    return res.status(401).json({ msg: "Invalid or expired token" });
  }
};
