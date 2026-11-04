const express = require("express");
const { requireAdminAuth } = require("../middleware/auth");
const { listMessages } = require("../controllers/contactController");

const router = express.Router();

router.use(requireAdminAuth);
router.get("/", listMessages);

module.exports = router;
