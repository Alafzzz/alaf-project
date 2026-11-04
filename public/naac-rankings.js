const API_BASE_CANDIDATES = [
  window.API_BASE_URL || "",
  "",
  "http://localhost:5000",
  "http://127.0.0.1:5000"
].filter((v, i, arr) => v !== undefined && arr.indexOf(v) === i);

const GRADE_ORDER = {
  "A++": 7,
  "A+": 6,
  A: 5,
  "B++": 4,
  "B+": 3,
  B: 2,
  C: 1
};

const state = {
  colleges: [],
  filtered: []
};

const elements = {
  searchInput: document.getElementById("naacSearchInput"),
  districtFilter: document.getElementById("naacDistrictFilter"),
  gradeFilter: document.getElementById("naacGradeFilter"),
  clearBtn: document.getElementById("naacClearBtn"),
  status: document.getElementById("naacStatus"),
  summary: document.getElementById("naacSummary"),
  grid: document.getElementById("naacGrid")
};

function normalizeCollege(c) {
  return {
    id: c.id || c.name,
    name: c.name || "Unknown College",
    city: c.city || "Unknown City",
    district: c.district || "Unknown District",
    rating: Number(c.rating) || 0,
    naacGrade: (c.naacGrade || "").trim(),
    naacCgpa: Number(c.naacCgpa) || 0,
    naacYear: Number(c.naacYear) || null,
    naacSource: c.naacSource || "",
    website: c.website || ""
  };
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function fillSelect(select, values) {
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

async function fetchAllFromApi(base) {
  const firstRes = await fetch(`${base}/api/colleges?page=1&limit=500`);
  if (!firstRes.ok) return null;
  const firstPayload = await firstRes.json();
  if (!firstPayload.data || !Array.isArray(firstPayload.data)) return null;

  const totalPages = firstPayload.pagination?.totalPages || 1;
  let all = [...firstPayload.data];
  for (let p = 2; p <= totalPages; p += 1) {
    const res = await fetch(`${base}/api/colleges?page=${p}&limit=500`);
    if (!res.ok) continue;
    const payload = await res.json();
    if (Array.isArray(payload.data)) all = all.concat(payload.data);
  }
  return all.map(normalizeCollege);
}

async function loadColleges() {
  for (const base of API_BASE_CANDIDATES) {
    try {
      const data = await fetchAllFromApi(base);
      if (data && data.length) {
        elements.status.textContent = `Connected to backend ${base || "(same origin)"}`;
        elements.status.classList.remove("warn");
        return data;
      }
    } catch (error) {
      // continue
    }
  }

  const localRes = await fetch("/data/colleges.json");
  if (!localRes.ok) throw new Error("Could not load college data.");
  const localData = await localRes.json();
  const normalized = Array.isArray(localData) ? localData.map(normalizeCollege) : [];
  elements.status.textContent = "Backend unavailable | Loaded local data";
  elements.status.classList.add("warn");
  return normalized;
}

function sortNaac(list) {
  return [...list].sort((a, b) => {
    const hasNaacA = Boolean(a.naacGrade);
    const hasNaacB = Boolean(b.naacGrade);
    if (hasNaacA !== hasNaacB) return hasNaacB - hasNaacA;

    const gradeA = GRADE_ORDER[a.naacGrade] || 0;
    const gradeB = GRADE_ORDER[b.naacGrade] || 0;
    if (gradeA !== gradeB) return gradeB - gradeA;
    if (a.naacCgpa !== b.naacCgpa) return b.naacCgpa - a.naacCgpa;
    if (a.rating !== b.rating) return b.rating - a.rating;
    return a.name.localeCompare(b.name);
  });
}

function applyFilters() {
  const q = elements.searchInput.value.trim().toLowerCase();
  const district = elements.districtFilter.value;
  const grade = elements.gradeFilter.value;

  state.filtered = sortNaac(
    state.colleges.filter((c) => {
      const searchMatch =
        !q || c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q);
      const districtMatch = !district || c.district === district;
      const gradeMatch =
        !grade || (grade === "UNVERIFIED" ? !c.naacGrade : c.naacGrade === grade);
      return searchMatch && districtMatch && gradeMatch;
    })
  );

  render();
}

function cardTemplate(c, rank) {
  const sourceHtml = c.naacSource
    ? `<a class="chip" href="${c.naacSource}" target="_blank" rel="noopener noreferrer">Source</a>`
    : "";
  const cgpaText = c.naacCgpa ? c.naacCgpa.toFixed(2) : "NA";
  const yearText = c.naacYear || "NA";
  const gradeText = c.naacGrade || "Unverified";
  const stars = "★".repeat(Math.max(1, Math.min(5, Math.round(c.rating || 0))));

  return `
    <article class="college-card college-card-v2">
      <div class="college-card-head">
        <p class="body-text naac-rank-badge">Rank #${rank}</p>
        <span class="college-rating-badge">${c.rating.toFixed(1)} / 5</span>
      </div>
      <h3>${c.name}</h3>
      <p class="body-text college-card-location">${c.city}, ${c.district}</p>
      <div class="college-meta-badges">
        <span class="college-meta-badge">Grade ${gradeText}</span>
        <span class="college-meta-badge">CGPA ${cgpaText}</span>
        <span class="college-meta-badge">Year ${yearText}</span>
      </div>
      <p class="body-text college-stars">${stars}</p>
      <div class="landing-actions">
        <a class="chip know-more-btn" href="college.html?id=${encodeURIComponent(c.id)}">View Details</a>
        ${sourceHtml}
      </div>
    </article>
  `;
}

function renderSummary() {
  const total = state.filtered.length;
  const verified = state.filtered.filter((c) => c.naacGrade);
  const gradeCounts = verified.reduce((acc, c) => {
    acc[c.naacGrade] = (acc[c.naacGrade] || 0) + 1;
    return acc;
  }, {});
  const topGrade = Object.entries(gradeCounts).sort(
    (a, b) => (GRADE_ORDER[b[0]] || 0) - (GRADE_ORDER[a[0]] || 0)
  )[0]?.[0] || "-";
  const cgpaBase = verified.filter((c) => c.naacCgpa > 0);
  const avgCgpa = cgpaBase.length
    ? (cgpaBase.reduce((sum, c) => sum + c.naacCgpa, 0) / cgpaBase.length).toFixed(2)
    : "0.00";

  elements.summary.innerHTML = `
    <article class="summary-card"><p class="label">Total Ranked</p><p class="value">${total}</p></article>
    <article class="summary-card"><p class="label">NAAC Verified</p><p class="value">${verified.length}</p></article>
    <article class="summary-card"><p class="label">Top Grade</p><p class="value">${topGrade}</p></article>
    <article class="summary-card"><p class="label">Average CGPA</p><p class="value">${avgCgpa}</p></article>
  `;
}

function render() {
  elements.grid.innerHTML = state.filtered.length
    ? state.filtered.map((c, i) => cardTemplate(c, i + 1)).join("")
    : "<p class='body-text'>No NAAC-verified colleges match these filters.</p>";
  renderSummary();
}

function bindEvents() {
  [elements.searchInput, elements.districtFilter, elements.gradeFilter].forEach((el) => {
    el.addEventListener("input", applyFilters);
    el.addEventListener("change", applyFilters);
  });

  elements.clearBtn.addEventListener("click", () => {
    elements.searchInput.value = "";
    elements.districtFilter.value = "";
    elements.gradeFilter.value = "";
    applyFilters();
  });
}

async function init() {
  const loaded = await loadColleges();
  state.colleges = sortNaac(loaded);
  state.filtered = [...state.colleges];

  fillSelect(elements.districtFilter, uniqueSorted(state.colleges.map((c) => c.district)));
  fillSelect(
    elements.gradeFilter,
    uniqueSorted(state.colleges.map((c) => c.naacGrade)).sort(
      (a, b) => (GRADE_ORDER[b] || 0) - (GRADE_ORDER[a] || 0)
    )
  );

  bindEvents();
  render();
}

init();
