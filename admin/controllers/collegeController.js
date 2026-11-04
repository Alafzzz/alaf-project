const path = require("path");
const fs = require("fs");
const { readColleges, writeColleges } = require("../services/store");
const { validateCollegePayload, slugify } = require("../services/validation");

function buildUniqueId(name, colleges) {
  const base = slugify(name) || `college-${Date.now()}`;
  let candidate = base;
  let counter = 1;
  while (colleges.some((c) => c.id === candidate)) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}

function listColleges(req, res) {
  const colleges = readColleges();
  return res.json({ data: colleges });
}

function createCollege(req, res) {
  const colleges = readColleges();
  const { value, errors } = validateCollegePayload(req.body, { partial: false });

  if (errors.length) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  const newCollege = {
    id: buildUniqueId(value.id || value.name, colleges),
    name: value.name,
    district: value.district,
    city: value.city,
    university: value.university || "",
    category: value.category || "",
    type: value.type,
    established: value.established,
    rating: value.rating ?? 0,
    averageFees: value.averageFees ?? 0,
    nirfBand: value.nirfBand || "NA",
    website: value.website || "",
    popularCourses: value.popularCourses || [],
    placements: value.placements || { highestPackageLPA: 0, averagePackageLPA: 0 },
    about: value.about || "",
    image: value.image || ""
  };

  colleges.push(newCollege);
  writeColleges(colleges);
  return res.status(201).json({ message: "College added", data: newCollege });
}

function updateCollege(req, res) {
  const collegeId = req.params.id;
  const colleges = readColleges();
  const index = colleges.findIndex((item) => item.id === collegeId);

  if (index === -1) {
    return res.status(404).json({ message: "College not found" });
  }

  const { value, errors } = validateCollegePayload(req.body, { partial: true });
  if (errors.length) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  const current = colleges[index];
  const updated = {
    ...current,
    ...value,
    id: current.id,
    placements: value.placements ? { ...current.placements, ...value.placements } : current.placements
  };

  colleges[index] = updated;
  writeColleges(colleges);
  return res.json({ message: "College updated", data: updated });
}

function deleteCollege(req, res) {
  const collegeId = req.params.id;
  const colleges = readColleges();
  const toDelete = colleges.find((item) => item.id === collegeId);

  if (!toDelete) {
    return res.status(404).json({ message: "College not found" });
  }

  const updated = colleges.filter((item) => item.id !== collegeId);
  writeColleges(updated);

  return res.json({ message: "College deleted", id: collegeId });
}

function uploadCollegeImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "Image file is required" });
  }

  const imageUrl = `/uploads/colleges/${req.file.filename}`;
  return res.status(201).json({ message: "Image uploaded", imageUrl });
}

function deleteUploadedImage(req, res) {
  const filename = String(req.params.filename || "").trim();
  if (!filename) {
    return res.status(400).json({ message: "filename is required" });
  }

  if (path.basename(filename) !== filename) {
    return res.status(400).json({ message: "Invalid filename" });
  }

  const uploadsRoot = path.resolve(__dirname, "..", "..", "public", "uploads", "colleges");
  const filePath = path.resolve(uploadsRoot, filename);
  if (!filePath.startsWith(uploadsRoot)) {
    return res.status(400).json({ message: "Invalid filename" });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "Image not found" });
  }

  fs.unlinkSync(filePath);
  return res.json({ message: "Image deleted" });
}

module.exports = {
  listColleges,
  createCollege,
  updateCollege,
  deleteCollege,
  uploadCollegeImage,
  deleteUploadedImage
};
