const bcrypt = require("bcryptjs");
const { getAdminCredentials, createAdminAccount } = require("../services/store");
const { signAdminToken } = require("../services/token");

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

function sanitizeUser(user) {
  return {
    username: user.username,
    role: "admin"
  };
}

async function login(req, res) {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");

  if (!username || !password) {
    return res.status(400).json({ message: "username and password are required" });
  }

  const admin = getAdminCredentials();
  const matchesUser = username === admin.username;
  const matchesPassword = matchesUser ? await bcrypt.compare(password, admin.passwordHash) : false;

  if (!matchesUser || !matchesPassword) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const user = sanitizeUser(admin);
  const token = signAdminToken(user);

  res.cookie("admin_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: EIGHT_HOURS_MS
  });

  return res.json({
    message: "Login successful",
    user
  });
}

async function signup(req, res) {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");

  if (!username || !password) {
    return res.status(400).json({ message: "username and password are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long." });
  }

  try {
    const user = await createAdminAccount(username, password);
    const token = signAdminToken(sanitizeUser(user));

    res.cookie("admin_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: EIGHT_HOURS_MS
    });

    return res.status(201).json({
      message: "Admin account created successfully",
      user: sanitizeUser(user)
    });
  } catch (error) {
    return res.status(409).json({ message: error.message || "Unable to create admin account." });
  }
}

function me(req, res) {
  return res.json({ user: req.admin });
}

function logout(req, res) {
  res.clearCookie("admin_token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
  return res.json({ message: "Logged out" });
}

module.exports = {
  login,
  signup,
  me,
  logout
};
