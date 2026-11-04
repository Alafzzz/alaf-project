const API_BASE_CANDIDATES = [
  window.API_BASE_URL || "",
  "",
  "http://localhost:5000",
  "http://127.0.0.1:5000"
].filter((v, i, arr) => v !== undefined && arr.indexOf(v) === i);

const state = {
  colleges: [],
  filtered: [],
  page: 1,
  limit: 9,
  streamFilter: ""
};

const elements = {
  searchInput: document.getElementById("searchInput"),
  districtFilter: document.getElementById("districtFilter"),
  typeFilter: document.getElementById("typeFilter"),
  courseFilter: document.getElementById("courseFilter"),
  admissionFilter: document.getElementById("admissionFilter"),
  maxFeesFilter: document.getElementById("maxFeesFilter"),
  maxFeesRange: document.getElementById("maxFeesRange"),
  sortSelect: document.getElementById("sortSelect"),
  clearBtn: document.getElementById("clearBtn"),
  filterPresets: document.getElementById("filterPresets"),
  activeFilterCount: document.getElementById("activeFilterCount"),
  activeFiltersInfo: document.getElementById("activeFiltersInfo"),
  backendStatus: document.getElementById("backendStatus"),
  statsText: document.getElementById("statsText"),
  summaryCards: document.getElementById("summaryCards"),
  districtChips: document.getElementById("districtChips"),
  collegeGrid: document.getElementById("collegeGrid"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  pageInfo: document.getElementById("pageInfo")
};

function setFeeRangeFromInput() {
  if (!elements.maxFeesRange || !elements.maxFeesFilter) return;
  const value = Number(elements.maxFeesFilter.value);
  elements.maxFeesRange.value = Number.isFinite(value) && value > 0 ? String(value) : "0";
}

function setFeeInputFromRange() {
  if (!elements.maxFeesRange || !elements.maxFeesFilter) return;
  const value = Number(elements.maxFeesRange.value) || 0;
  elements.maxFeesFilter.value = value > 0 ? String(value) : "";
}

function setRangeMaxFromData() {
  if (!elements.maxFeesRange || !Array.isArray(state.colleges) || !state.colleges.length) return;
  const highest = Math.max(...state.colleges.map((c) => Number(c.averageFees) || 0));
  const rounded = Math.max(50000, Math.ceil(highest / 5000) * 5000);
  elements.maxFeesRange.max = String(rounded);
}

function setSelectByKeyword(selectEl, keywords) {
  if (!selectEl) return;
  const match = Array.from(selectEl.options).find((opt) => {
    const label = String(opt.value || "").toLowerCase();
    return keywords.some((keyword) => label.includes(keyword));
  });
  if (match) selectEl.value = match.value;
}

function applyPreset(preset) {
  if (!preset) return;
  elements.searchInput.value = "";
  elements.districtFilter.value = "";
  elements.typeFilter.value = "";
  elements.courseFilter.value = "";
  elements.admissionFilter.value = "";
  elements.maxFeesFilter.value = "";
  if (elements.maxFeesRange) elements.maxFeesRange.value = "0";
  elements.sortSelect.value = "rating_desc";
  state.streamFilter = "";

  if (preset === "budget") {
    elements.maxFeesFilter.value = "120000";
    elements.sortSelect.value = "fees_asc";
  } else if (preset === "engineering") {
    state.streamFilter = "Engineering";
    elements.sortSelect.value = "rating_desc";
    setSelectByKeyword(elements.courseFilter, ["b.tech", "engineering", "technology", "m.tech"]);
  } else if (preset === "medical") {
    state.streamFilter = "Medical";
    setSelectByKeyword(elements.courseFilter, ["mbbs", "medical", "nursing", "pharmacy", "dental"]);
  }

  setFeeRangeFromInput();
  applyFilters();
}

function updateActiveFilterUI() {
  const active = [];
  const q = elements.searchInput.value.trim();
  const district = elements.districtFilter.value;
  const type = elements.typeFilter.value;
  const course = elements.courseFilter.value;
  const admission = elements.admissionFilter.value;
  const maxFees = Number(elements.maxFeesFilter.value) || 0;
  const sort = elements.sortSelect.value;

  if (q) active.push(`Search: ${q}`);
  if (district) active.push(`District: ${district}`);
  if (type) active.push(`Type: ${type}`);
  if (course) active.push(`Course: ${course}`);
  if (admission) active.push(`Admission: ${admission}`);
  if (maxFees > 0) active.push(`Max fees: INR ${maxFees.toLocaleString()}`);
  if (state.streamFilter) active.push(`Stream: ${state.streamFilter}`);
  if (sort !== "rating_desc") active.push(`Sort: ${elements.sortSelect.options[elements.sortSelect.selectedIndex].textContent}`);

  if (elements.activeFilterCount) {
    elements.activeFilterCount.textContent = `${active.length} Active`;
  }
  if (elements.activeFiltersInfo) {
    elements.activeFiltersInfo.textContent = active.length
      ? active.join(" | ")
      : "No active filters.";
  }
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

function inferStreams(college) {
  const text = `${college.category || ""} ${college.type || ""} ${(college.popularCourses || []).join(" ")}`.toLowerCase();
  const streams = [];
  const matches = (keywords) => keywords.some((k) => text.includes(k));

  if (matches(["engineering", "technology", "b.tech", "m.tech", "mca", "polytechnic"])) {
    streams.push("Engineering");
  }
  if (matches(["arts", "science", "bsc", "ba", "bcom", "msc", "mcom", "ma", "commerce"])) {
    streams.push("Arts & Science");
  }
  if (matches(["management", "business", "mba", "bba", "pgdm"])) {
    streams.push("Management");
  }
  if (matches(["medical", "mbbs", "nursing", "pharmacy", "dental", "health"])) {
    streams.push("Medical");
  }
  if (matches(["law", "llb", "llm", "legal"])) {
    streams.push("Law");
  }
  if (matches(["phd", "research", "doctorate", "scholar"])) {
    streams.push("Research");
  }
  return streams.length ? streams : ["Arts & Science"];
}

function normalizeCollege(c) {
  return {
    id: c.id || c.name,
    name: c.name || "Unknown College",
    city: c.city || "Unknown City",
    district: c.district || "Unknown District",
    type: c.type || "General",
    established: Number(c.established) || null,
    rating: Number(c.rating) || 0,
    averageFees: Number(c.averageFees) || 0,
    website: c.website || "",
    popularCourses: Array.isArray(c.popularCourses) ? c.popularCourses : [],
    courseFees: c.courseFees && typeof c.courseFees === "object" ? c.courseFees : {},
    admissionModes: inferAdmissionModes(c),
    streams: inferStreams(c),
    placements: c.placements || { highestPackageLPA: 0, averagePackageLPA: 0 },
    about: c.about || "No description available."
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
  const firstRes = await fetch(`${base}/api/colleges?page=1&limit=200`);
  if (!firstRes.ok) return null;
  const firstPayload = await firstRes.json();
  if (!firstPayload.data || !Array.isArray(firstPayload.data)) return null;

  const totalPages = firstPayload.pagination?.totalPages || 1;
  let all = [...firstPayload.data];
  for (let p = 2; p <= totalPages; p += 1) {
    const res = await fetch(`${base}/api/colleges?page=${p}&limit=200`);
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
        elements.backendStatus.textContent = "";
        elements.backendStatus.classList.remove("warn");
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
  elements.backendStatus.textContent = `Backend unavailable | Loaded local data (${normalized.length} colleges)`;
  elements.backendStatus.classList.add("warn");
  return normalized;
}

function sortColleges(list) {
  const mode = elements.sortSelect.value;
  const sorted = [...list];
  if (mode === "fees_asc") sorted.sort((a, b) => a.averageFees - b.averageFees);
  else if (mode === "fees_desc") sorted.sort((a, b) => b.averageFees - a.averageFees);
  else if (mode === "name_asc") sorted.sort((a, b) => a.name.localeCompare(b.name));
  else sorted.sort((a, b) => b.rating - a.rating);
  return sorted;
}

function applyFilters() {
  const q = elements.searchInput.value.trim().toLowerCase();
  const district = elements.districtFilter.value;
  const type = elements.typeFilter.value;
  const course = elements.courseFilter.value;
  const admission = elements.admissionFilter.value;
  const maxFees = Number(elements.maxFeesFilter.value) || null;
  const stream = state.streamFilter;

  const filtered = state.colleges.filter((c) => {
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.district.toLowerCase().includes(q);
    const matchesDistrict = !district || c.district === district;
    const matchesType = !type || c.type === type;
    const matchesCourse = !course || c.popularCourses.includes(course);
    const matchesAdmission = !admission || c.admissionModes.includes(admission);
    const matchesFees = maxFees === null || c.averageFees <= maxFees;
    const matchesStream = !stream || c.streams.includes(stream);
    return (
      matchesSearch &&
      matchesDistrict &&
      matchesType &&
      matchesCourse &&
      matchesAdmission &&
      matchesFees &&
      matchesStream
    );
  });

  state.filtered = sortColleges(filtered);
  state.page = 1;
  updateActiveFilterUI();
  render();
}

function cardTemplate(c) {
  const website = c.website || `https://www.google.com/search?q=${encodeURIComponent(`${c.name} official website`)}`;
  const courseCount = c.popularCourses.length;
  const admissions = c.admissionModes.join(", ");
  const stars = "★".repeat(Math.max(1, Math.min(5, Math.round(c.rating || 0))));
  const topCourses = c.popularCourses.slice(0, 3).join(" | ") || "Course details available in profile";
  return `
    <article class="college-card college-card-v2">
      <div class="college-card-head">
        <h3>${c.name}</h3>
        <span class="college-rating-badge">${c.rating.toFixed(1)} / 5</span>
      </div>
      <p class="body-text college-card-location">${c.city}, ${c.district}</p>
      <div class="college-meta-badges">
        <span class="college-meta-badge">${c.type}</span>
        <span class="college-meta-badge">INR ${c.averageFees.toLocaleString()} / year</span>
        <span class="college-meta-badge">${courseCount} Courses</span>
      </div>
      <p class="body-text college-stars">${stars}</p>
      <p class="body-text"><strong>Top Courses:</strong> ${topCourses}</p>
      <p class="body-text"><strong>Admission:</strong> ${admissions}</p>
      <div class="landing-actions">
        <a class="chip know-more-btn" href="college.html?id=${encodeURIComponent(c.id)}">View Details</a>
        <a class="chip" href="${website}" target="_blank" rel="noopener noreferrer">Official Website</a>
      </div>
    </article>
  `;
}

function render() {
  const total = state.filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / state.limit));
  state.page = Math.min(state.page, totalPages);
  const start = (state.page - 1) * state.limit;
  const pageItems = state.filtered.slice(start, start + state.limit);

  elements.collegeGrid.innerHTML = pageItems.length
    ? pageItems.map(cardTemplate).join("")
    : "<p class='body-text'>No colleges found for current filters.</p>";

  const streamText = state.streamFilter ? ` | Stream: ${state.streamFilter}` : "";
  elements.statsText.textContent = `Showing ${pageItems.length} of ${total} colleges${streamText}`;
  elements.pageInfo.textContent = `Page ${state.page} of ${totalPages}`;
  elements.prevBtn.disabled = state.page <= 1;
  elements.nextBtn.disabled = state.page >= totalPages;

  const avgFees = total
    ? Math.round(state.filtered.reduce((sum, c) => sum + c.averageFees, 0) / total)
    : 0;
  const topDistrict = total
    ? Object.entries(
      state.filtered.reduce((acc, c) => {
        acc[c.district] = (acc[c.district] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1])[0]?.[0] || "-"
    : "-";

  if (elements.summaryCards) {
    elements.summaryCards.innerHTML = `
      <article class="summary-card"><p class="label">Total Results</p><p class="value">${total}</p></article>
      <article class="summary-card"><p class="label">Average Fees</p><p class="value">INR ${avgFees.toLocaleString()}</p></article>
      <article class="summary-card"><p class="label">Top District</p><p class="value">${topDistrict}</p></article>
    `;
  }
}

function readQueryDefaults() {
  const params = new URLSearchParams(window.location.search);
  const get = (key) => params.get(key)?.trim() || "";
  return {
    search: get("search"),
    district: get("district"),
    type: get("type"),
    course: get("course"),
    admission: get("admission"),
    sort: get("sort"),
    maxFees: get("maxFees"),
    stream: get("stream")
  };
}

function safeSetSelect(selectEl, value) {
  if (!selectEl || !value) return;
  const exists = Array.from(selectEl.options).some((opt) => opt.value === value);
  if (exists) selectEl.value = value;
}

function applyQueryDefaults() {
  const defaults = readQueryDefaults();
  if (defaults.search) elements.searchInput.value = defaults.search;
  if (defaults.maxFees && Number(defaults.maxFees) > 0) elements.maxFeesFilter.value = defaults.maxFees;
  safeSetSelect(elements.districtFilter, defaults.district);
  safeSetSelect(elements.typeFilter, defaults.type);
  safeSetSelect(elements.courseFilter, defaults.course);
  safeSetSelect(elements.admissionFilter, defaults.admission);
  safeSetSelect(elements.sortSelect, defaults.sort);
  state.streamFilter = defaults.stream;
}

function renderDistrictChips() {
  if (!elements.districtChips) return;
  const districts = uniqueSorted(state.colleges.map((c) => c.district));
  elements.districtChips.innerHTML =
    `<button class="chip chip-district active" data-district="">All</button>` +
    districts
      .map((d) => `<button class="chip chip-district" data-district="${d}">${d}</button>`)
      .join("");
}

function bindEvents() {
  [
    elements.searchInput,
    elements.districtFilter,
    elements.typeFilter,
    elements.courseFilter,
    elements.admissionFilter,
    elements.maxFeesFilter,
    elements.sortSelect
  ].filter(Boolean).forEach((el) => {
    el.addEventListener("input", applyFilters);
    el.addEventListener("change", applyFilters);
  });

  if (elements.maxFeesFilter) {
    elements.maxFeesFilter.addEventListener("input", setFeeRangeFromInput);
    elements.maxFeesFilter.addEventListener("change", setFeeRangeFromInput);
  }

  if (elements.maxFeesRange) {
    elements.maxFeesRange.addEventListener("input", () => {
      setFeeInputFromRange();
      applyFilters();
    });
    elements.maxFeesRange.addEventListener("change", () => {
      setFeeInputFromRange();
      applyFilters();
    });
  }

  elements.clearBtn.addEventListener("click", () => {
    elements.searchInput.value = "";
    elements.districtFilter.value = "";
    elements.typeFilter.value = "";
    elements.courseFilter.value = "";
    elements.admissionFilter.value = "";
    elements.maxFeesFilter.value = "";
    if (elements.maxFeesRange) elements.maxFeesRange.value = "0";
    elements.sortSelect.value = "rating_desc";
    state.streamFilter = "";
    if (elements.filterPresets) {
      elements.filterPresets.querySelectorAll(".preset-btn").forEach((el) => {
        el.classList.remove("active");
      });
    }
    applyFilters();
    elements.districtChips.querySelectorAll(".chip-district").forEach((chip, idx) => {
      chip.classList.toggle("active", idx === 0);
    });
  });

  elements.prevBtn.addEventListener("click", () => {
    state.page -= 1;
    render();
  });
  elements.nextBtn.addEventListener("click", () => {
    state.page += 1;
    render();
  });

  if (elements.districtChips) {
    elements.districtChips.addEventListener("click", (event) => {
      const chip = event.target.closest(".chip-district");
      if (!chip) return;
      elements.districtFilter.value = chip.dataset.district || "";
      elements.districtChips.querySelectorAll(".chip-district").forEach((el) => {
        el.classList.toggle("active", el === chip);
      });
      applyFilters();
    });
  }

  if (elements.filterPresets) {
    elements.filterPresets.addEventListener("click", (event) => {
      const button = event.target.closest(".preset-btn");
      if (!button) return;
      const selectedPreset = button.dataset.preset || "";
      elements.filterPresets.querySelectorAll(".preset-btn").forEach((el) => {
        el.classList.toggle("active", el === button);
      });
      applyPreset(selectedPreset);
    });
  }
}

async function init() {
  state.colleges = await loadColleges();
  state.filtered = [...state.colleges];

  fillSelect(elements.districtFilter, uniqueSorted(state.colleges.map((c) => c.district)));
  fillSelect(elements.typeFilter, uniqueSorted(state.colleges.map((c) => c.type)));
  fillSelect(elements.courseFilter, uniqueSorted(state.colleges.flatMap((c) => c.popularCourses)));
  fillSelect(elements.admissionFilter, uniqueSorted(state.colleges.flatMap((c) => c.admissionModes)));
  setRangeMaxFromData();

  applyQueryDefaults();
  setFeeRangeFromInput();
  state.filtered = sortColleges(state.filtered);
  renderDistrictChips();
  bindEvents();
  applyFilters();
}

init();
