const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { requireAdminAuth } = require("../middleware/auth");
const {
  listColleges,
  createCollege,
  updateCollege,
  deleteCollege,
  uploadCollegeImage,
  deleteUploadedImage
} = require("../controllers/collegeController");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "..", "public", "uploads", "colleges");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (String(file.mimetype || "").startsWith("image/")) {
      return cb(null, true);
    }
    return cb(new Error("Only image files are allowed"));
  }
});

router.use(requireAdminAuth);

router.get("/", listColleges);
router.post("/", createCollege);
router.put("/:id", updateCollege);
router.delete("/:id", deleteCollege);

router.post("/upload", (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "Upload failed" });
    }
    return next();
  });
}, uploadCollegeImage);

router.delete("/image/:filename", deleteUploadedImage);

module.exports = router;
