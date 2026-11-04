const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "replace-this-jwt-secret-in-production";
const TOKEN_EXPIRES_IN = process.env.ADMIN_TOKEN_EXPIRES_IN || "8h";

function signAdminToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
}

function verifyAdminToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  signAdminToken,
  verifyAdminToken
};
