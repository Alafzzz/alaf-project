const API_BASE_CANDIDATES = ["", "http://localhost:5000", "http://127.0.0.1:5000"];
const REVIEWS_KEY = "kch_reviews";
let currentCollege = null;

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function websiteFallback(name) {
  const q = encodeURIComponent(`${name} official website`);
  return `https://www.google.com/search?q=${q}`;
}

function getHeroBackground(college) {
  if (college && college.image && typeof college.image === "string" && college.image.trim()) {
    return `linear-gradient(120deg, rgba(16, 33, 73, 0.45), rgba(8, 16, 36, 0.65)), url('${college.image}')`;
  }
  return `linear-gradient(135deg, rgba(14, 28, 64, 0.9) 0%, rgba(30, 58, 138, 0.8) 50%, rgba(15, 23, 42, 0.95) 100%)`;
}

function inferAdmissionModes(college) {
  if (Array.isArray(college.admissionModes) && college.admissionModes.length) {
    return [...new Set(college.admissionModes)];
  }

  const text = `${college.name || ""} ${college.type || ""} ${college.category || ""}`.toLowerCase();
  const isGovernment = text.includes("government") || text.includes("govt");
  const isSelfFinancing = text.includes("self") || text.includes("private");
  const isEngineeringOrMedical =
    text.includes("engineering") ||
    text.includes("medical") ||
    text.includes("architecture") ||
    text.includes("technology");

  if (isGovernment) return ["Entrance", "Aided"];
  if (isEngineeringOrMedical) return ["Entrance", "Management"];
  if (isSelfFinancing) return ["Management"];
  return ["Aided", "Management"];
}

function admissionGuideText(mode) {
  if (mode === "Entrance") {
    return "Apply through entrance/counselling portals and allotment process, then complete document verification.";
  }
  if (mode === "Management") {
    return "Apply directly at the college management quota desk with marksheets, ID proof, and fee payment schedule.";
  }
  if (mode === "Aided") {
    return "Apply through merit/aided seat allotment under university/government process and confirm admission on time.";
  }
  return "Check the official college notice for admission steps.";
}

function estimatedCourseFee(course, avg) {
  const base = Number(avg) || 40000;
  const c = String(course || "").toLowerCase();
  let factor = 1;
  if (c.includes("mbbs") || c.includes("md") || c.includes("ms")) factor = 8;
  else if (c.includes("b.tech") || c.includes("engineering")) factor = 1.9;
  else if (c.includes("m.tech")) factor = 1.8;
  else if (c.includes("mba")) factor = 1.6;
  else if (c.includes("mca") || c.includes("bca") || c.includes("computer")) factor = 1.35;
  else if (c.includes("bba")) factor = 1.2;
  else if (c.includes("bcom") || c.includes("commerce")) factor = 1.05;
  else if (c.includes("ma") || c.includes("msc") || c.includes("mcom")) factor = 1.25;
  return Math.round(base * factor);
}

function getCourseFeeMap(college) {
  const map = {};
  const raw = college.courseFees && typeof college.courseFees === "object" ? college.courseFees : {};
  const courses = Array.isArray(college.popularCourses) ? college.popularCourses : [];
  courses.forEach((course) => {
    const saved = Number(raw[course]) || null;
    map[course] = saved || estimatedCourseFee(course, college.averageFees);
  });
  return map;
}

function defaultReviewsForCollege(college) {
  const rating = (Number(college?.rating) || 3.8).toFixed(1);
  const currentYear = new Date().getFullYear();
  return [
    {
      user: "Anjana K",
      rating: Math.min(5, Math.max(3, Math.round(Number(rating)))),
      text: "Good faculty support and better academic atmosphere. Campus life is active and helpful.",
      date: `12/08/${currentYear - 1}`
    },
    {
      user: "Rahul M",
      rating: Math.min(5, Math.max(3, Math.round(Number(rating)))),
      text: "Decent placement guidance and useful department activities. Course structure is manageable.",
      date: `03/11/${currentYear - 1}`
    }
  ];
}

async function fetchCollegeById(id) {
  const targetId = String(id || "").trim().toLowerCase();
  for (const base of API_BASE_CANDIDATES) {
    try {
      const res = await fetch(`${base}/api/colleges/${encodeURIComponent(id)}`);
      if (res.ok) return await res.json();
    } catch (error) {
      // continue
    }
  }

  try {
    const local = await fetch("/data/colleges.json");
    if (!local.ok) return null;
    const data = await local.json();
    return Array.isArray(data)
      ? data.find(
          (c) =>
            c.id === id ||
            String(c.id || "").toLowerCase() === targetId ||
            String(c.name || "").toLowerCase() === targetId
        ) || null
      : null;
  } catch (error) {
    return null;
  }
}

function renderCollege(c) {
  currentCollege = c;
  document.getElementById("collegeTitle").textContent = c.name || "College Details";
  document.getElementById("collegeMeta").textContent = `${c.city || "-"}, ${c.district || "-"} | ${c.type || "-"}`;
  document.getElementById("collegeAbout").textContent = c.about || "No description available.";
  document.getElementById("detailFees").textContent = `INR ${(Number(c.averageFees) || 0).toLocaleString()}`;
  document.getElementById("detailRating").textContent = `${(Number(c.rating) || 0).toFixed(1)} / 5`;
  document.getElementById("detailAvgPkg").textContent = `${c.placements?.averagePackageLPA || 0} LPA`;

  const courses = Array.isArray(c.popularCourses) ? c.popularCourses : [];
  const courseFees = getCourseFeeMap(c);
  document.getElementById("courseCountText").textContent = `${courses.length} courses available`;
  document.getElementById("collegeCourses").innerHTML = courses.length
    ? `
      <div class="course-fees-table-wrap">
        <table class="course-fees-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Annual Fee (INR)</th>
            </tr>
          </thead>
          <tbody>
            ${courses
              .map((course) => `<tr><td>${course}</td><td>${Number(courseFees[course]).toLocaleString()}</td></tr>`)
              .join("")}
          </tbody>
        </table>
      </div>
    `
    : "<span class='requested-item'>No course data</span>";

  const websiteBtn = document.getElementById("visitWebsiteBtn");
  websiteBtn.href = c.website || websiteFallback(c.name || "college");

  const heroEl = document.getElementById("collegeHeroMedia");
  if (heroEl) {
    heroEl.style.backgroundImage = getHeroBackground(c);
  }

  const contactMetaEl = document.getElementById("collegeContactMeta");
  if (contactMetaEl) {
    const websiteText = c.website || "Website link available via button";
    contactMetaEl.textContent = `Location: ${c.city || "-"}, ${c.district || "-"} | University: ${c.university || "-"} | Website: ${websiteText}`;
  }

  const quickLocation = document.getElementById("quickLocation");
  const quickRating = document.getElementById("quickRating");
  const quickFees = document.getElementById("quickFees");
  const quickPackage = document.getElementById("quickPackage");

  if (quickLocation) quickLocation.textContent = `${c.city || "-"}, ${c.district || "-"}`;
  if (quickRating) quickRating.textContent = `${(Number(c.rating) || 0).toFixed(1)} / 5`;
  if (quickFees) quickFees.textContent = `INR ${(Number(c.averageFees) || 0).toLocaleString()}`;
  if (quickPackage) quickPackage.textContent = `${c.placements?.averagePackageLPA || 0} LPA`;

  const modes = inferAdmissionModes(c);
  document.getElementById("admissionModes").innerHTML = modes
    .map((mode) => `<span class="requested-item">${mode}</span>`)
    .join("");
  document.getElementById("admissionGuide").innerHTML = modes
    .map(
      (mode) => `
      <article class="summary-card">
        <p class="label">${mode}</p>
        <p class="body-text">${admissionGuideText(mode)}</p>
      </article>
    `
    )
    .join("");
}

function getAllReviews() {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function setAllReviews(data) {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(data));
}

function getCollegeReviews(collegeId) {
  const all = getAllReviews();
  const list = all[collegeId];
  return Array.isArray(list) ? list : [];
}

function saveCollegeReview(collegeId, review) {
  const all = getAllReviews();
  const existing = Array.isArray(all[collegeId]) ? all[collegeId] : [];
  all[collegeId] = [review, ...existing];
  setAllReviews(all);
}

function renderReviews(collegeId) {
  const listEl = document.getElementById("reviewList");
  const infoEl = document.getElementById("reviewInfo");
  const userReviews = getCollegeReviews(collegeId);
  const defaultReviews = currentCollege ? defaultReviewsForCollege(currentCollege) : [];
  const reviews = userReviews.length ? userReviews : defaultReviews;

  if (!reviews.length) {
    infoEl.textContent = "No reviews yet. Be the first student to review this college.";
    listEl.innerHTML = "";
    return;
  }

  const avg = (
    reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length
  ).toFixed(1);
  infoEl.textContent = `${reviews.length} review(s) | Student average: ${avg}/5`;
  listEl.innerHTML = reviews
    .map((r) => {
      const initials = String(r.user || "S").trim().slice(0, 2).toUpperCase();
      const stars = "★".repeat(Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5))));
      return `
      <article class="review-card" style="display: grid; gap: 8px;">
        <div class="review-head" style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span class="review-avatar">${initials}</span>
            <div>
              <strong style="color: #0f172a; font-size: 14px;">${r.user || "Student"}</strong>
              <small style="display: block; color: #64748b; font-size: 11px;">Verified Student Review</small>
            </div>
          </div>
          <span style="font-size: 12px; color: #64748b;">${r.date || ""}</span>
        </div>
        <p class="review-rating" style="margin: 0; color: #f59e0b; letter-spacing: 0.05em;">${stars} <span style="color: #0f172a; font-size: 12px; font-weight: 800; margin-left: 4px;">${r.rating}/5</span></p>
        <p class="body-text" style="margin: 0;">${r.text}</p>
      </article>
    `;
    })
    .join("");
}

function bindReviewForm(collegeId) {
  const form = document.getElementById("reviewForm");
  const ratingEl = document.getElementById("reviewRating");
  const textEl = document.getElementById("reviewText");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const rating = Number(ratingEl.value);
    const text = textEl.value.trim();
    if (!rating || !text) return;

    let user = localStorage.getItem("kch_user");
    if (!user) {
      user = "Student";
    } else if (user.includes("@")) {
      user = user.split("@")[0];
    }

    const now = new Date();
    const review = {
      user,
      rating,
      text,
      date: now.toLocaleDateString()
    };
    saveCollegeReview(collegeId, review);
    form.reset();
    renderReviews(collegeId);
  });
}

async function init() {
  const id = getParam("id");
  if (!id) {
    document.getElementById("collegeTitle").textContent = "College not selected";
    return;
  }
  const college = await fetchCollegeById(id);
  if (!college) {
    document.getElementById("collegeTitle").textContent = "College not found";
    return;
  }
  renderCollege(college);
  bindReviewForm(id);
  renderReviews(id);
}

init();
