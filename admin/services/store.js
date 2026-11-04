const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const collegesPath = path.join(__dirname, "..", "..", "data", "colleges.json");
const adminPath = path.join(__dirname, "..", "..", "data", "admin.json");

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, "utf8");
  const cleaned = raw.replace(/^\uFEFF/, "").trim();
  if (!cleaned) return fallback;
  return JSON.parse(cleaned);
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readColleges() {
  const list = readJson(collegesPath, []);
  return Array.isArray(list) ? list : [];
}

function writeColleges(colleges) {
  writeJson(collegesPath, colleges);
}

function ensureAdminSeed() {
  const existing = readJson(adminPath, {});
  if (existing && existing.username && existing.passwordHash) return existing;

  const username = process.env.ADMIN_USERNAME || "alaf15123456789@gmail.com";
  const password = process.env.ADMIN_PASSWORD || "Admin@12345";
  const passwordHash = bcrypt.hashSync(password, 10);
  const seeded = {
    username,
    passwordHash,
    updatedAt: new Date().toISOString()
  };

  writeJson(adminPath, seeded);
  return seeded;
}

function createAdminAccount(username, password) {
  const existing = readJson(adminPath, null);
  const normalizedNew = String(username).trim().toLowerCase();
  const existingUser = String(existing?.username || "").trim().toLowerCase();

  if (existing && existingUser === normalizedNew) {
    throw new Error("This admin username already exists.");
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const admin = {
    username: String(username).trim(),
    passwordHash,
    updatedAt: new Date().toISOString()
  };

  writeJson(adminPath, admin);
  return admin;
}

function getAdminCredentials() {
  return ensureAdminSeed();
}

module.exports = {
  readColleges,
  writeColleges,
  getAdminCredentials,
  createAdminAccount
};
