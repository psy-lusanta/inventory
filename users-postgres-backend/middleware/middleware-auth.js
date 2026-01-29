const jwt = require("jsonwebtoken");

// Extract Bearer token from Authorization header safely
function getTokenFromHeader(req) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;

  return parts[1];
}

// Middleware 1: Verify JWT token
function authenticateToken(req, res, next) {
  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ error: "Token missing" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET,
    { algorithms: ["HS256"] },
    (err, payload) => {
      if (err) {
        return res.status(403).json({ error: "Invalid or expired token" });
      }

      // Attach full user to request
      req.user = {
        id: payload.id,
        username: payload.username,
        role: payload.role,
        employee_name: payload.employee_name
      };
      next();
    }
  );
}

// Middleware 2: Require admin role
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "administrator") {
    return res.status(403).json({ error: "Admin privileges required" });
  }
  next();
}

// Middleware 3 (optional): Allow multiple roles
function requireRole(roles = []) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permission" });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireAdmin,
  requireRole,
};
