const jwt = require("jsonwebtoken");

// Authentication middleware
const auth = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization") || "";
    console.log("Auth header:", authHeader);
    let token = null;

    // Primary: Bearer token from header
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "").trim();
    }

    // Fallback: token passed as query param (useful for direct download links)
    if (!token && req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    const secret = process.env.JWT_SECRET || "jwtsecret";

    const decoded = jwt.verify(token, secret);
    console.log("Decoded user:", decoded);

    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ message: `Token is not valid: ${error.message}` });
  }
};

// Admin only middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
  next();
};

module.exports = { auth, adminOnly };
