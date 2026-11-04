const { verifyAdminToken } = require("../services/token");

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  return req.cookies?.admin_token || "";
}

function requireAdminAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = verifyAdminToken(token);
    req.admin = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
}

module.exports = {
  requireAdminAuth
};
