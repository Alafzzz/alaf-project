const express = require("express");
const { login, me, logout, signup } = require("../controllers/authController");
const { requireAdminAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.get("/me", requireAdminAuth, me);
router.post("/logout", requireAdminAuth, logout);

module.exports = router;
