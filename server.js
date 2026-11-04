const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");

const adminAuthRoutes = require("./admin/routes/authRoutes");
const adminCollegeRoutes = require("./admin/routes/collegeRoutes");
const adminContactRoutes = require("./admin/routes/contactRoutes");
const contactRoutes = require("./routes/contactRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

const collegesPath = path.join(__dirname, "data", "colleges.json");

function readColleges() {
  const raw = fs.readFileSync(collegesPath, "utf8");
  const cleaned = raw.replace(/^\uFEFF/, "");
  return JSON.parse(cleaned);
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

app.get("/api/colleges", (req, res) => {
  const {
    search = "",
    district,
    course,
    type,
    minFees,
    maxFees,
    page = 1,
    limit = 9
  } = req.query;

  const colleges = readColleges();
  const searchText = String(search).trim().toLowerCase();
  const min = toNumber(minFees);
  const max = toNumber(maxFees);

  let filtered = colleges.filter((college) => {
    const matchesSearch =
      !searchText ||
      college.name.toLowerCase().includes(searchText) ||
      college.city.toLowerCase().includes(searchText) ||
      college.district.toLowerCase().includes(searchText);

    const matchesDistrict = !district || college.district === district;
    const matchesType = !type || college.type === type;
    const matchesCourse = !course || college.popularCourses.includes(course);
    const matchesMin = min === null || college.averageFees >= min;
    const matchesMax = max === null || college.averageFees <= max;

    return (
      matchesSearch &&
      matchesDistrict &&
      matchesType &&
      matchesCourse &&
      matchesMin &&
      matchesMax
    );
  });

  filtered = filtered.sort((a, b) => b.rating - a.rating);

  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.max(1, Number(limit) || 9);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (pageNumber - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  res.json({
    data: paginated,
    pagination: {
      total,
      page: pageNumber,
      limit: pageSize,
      totalPages
    }
  });
});

app.get("/api/colleges/:id", (req, res) => {
  const colleges = readColleges();
  const college = colleges.find((item) => item.id === req.params.id);

  if (!college) {
    return res.status(404).json({ message: "College not found" });
  }

  return res.json(college);
});

app.get("/api/meta", (req, res) => {
  const colleges = readColleges();

  const districts = [...new Set(colleges.map((c) => c.district))].sort();
  const types = [...new Set(colleges.map((c) => c.type))].sort();
  const courses = [...new Set(colleges.flatMap((c) => c.popularCourses))].sort();

  res.json({ districts, types, courses });
});

app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/colleges", adminCollegeRoutes);
app.use("/api/admin/messages", adminContactRoutes);
app.use("/api/contact", contactRoutes);

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin", "index.html"));
});

app.get("/admin-login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin", "index.html"));
});

app.get("/admin/*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin", "index.html"));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
