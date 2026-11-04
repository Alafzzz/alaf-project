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

const uploadDir = path.join(__dirname, "public", "uploads", "colleges");
fs.mkdirSync(uploadDir, { recursive: true });

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Static routes
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));
app.use("/data", express.static(path.join(__dirname, "data")));

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
      (college.name && college.name.toLowerCase().includes(searchText)) ||
      (college.city && college.city.toLowerCase().includes(searchText)) ||
      (college.district && college.district.toLowerCase().includes(searchText));

    const matchesDistrict = !district || college.district === district;
    const matchesType = !type || college.type === type;
    const matchesCourse = !course || (Array.isArray(college.popularCourses) && college.popularCourses.includes(course));
    const matchesMin = min === null || (Number(college.averageFees) || 0) >= min;
    const matchesMax = max === null || (Number(college.averageFees) || 0) <= max;

    return (
      matchesSearch &&
      matchesDistrict &&
      matchesType &&
      matchesCourse &&
      matchesMin &&
      matchesMax
    );
  });

  filtered = filtered.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));

  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(1000, Math.max(1, Number(limit) || 9));
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
  const targetId = String(req.params.id || "").trim().toLowerCase();
  const college = colleges.find(
    (item) => item.id === req.params.id || String(item.id || "").toLowerCase() === targetId
  );

  if (!college) {
    return res.status(404).json({ message: "College not found" });
  }

  return res.json(college);
});

app.get("/api/meta", (req, res) => {
  const colleges = readColleges();

  const districts = [...new Set(colleges.map((c) => c.district).filter(Boolean))].sort();
  const types = [...new Set(colleges.map((c) => c.type).filter(Boolean))].sort();
  const courses = [...new Set(colleges.flatMap((c) => c.popularCourses || []).filter(Boolean))].sort();

  res.json({ districts, types, courses });
});

app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/colleges", adminCollegeRoutes);
app.use("/api/admin/messages", adminContactRoutes);
app.use("/api/contact", contactRoutes);

// Explicit page routes
const sendPage = (pageName) => (req, res) => {
  res.sendFile(path.join(__dirname, "public", pageName));
};

app.get(["/rankings", "/rankings.html"], sendPage("rankings.html"));
app.get(["/naac-rankings", "/naac-rankings.html"], sendPage("naac-rankings.html"));
app.get(["/programs", "/programs.html"], sendPage("programs.html"));
app.get(["/about", "/about.html"], sendPage("about.html"));
app.get(["/contact", "/contact.html"], sendPage("contact.html"));
app.get(["/decision-guide", "/decision-guide.html"], sendPage("decision-guide.html"));
app.get(["/college", "/college.html"], sendPage("college.html"));
app.get(["/login", "/login.html"], sendPage("login.html"));
app.get(["/signup", "/signup.html"], sendPage("signup.html"));

app.get(["/admin", "/admin-login", "/admin/*"], (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin", "index.html"));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
