const API_BASE_CANDIDATES = [
  window.API_BASE_URL || "",
  "",
  "http://localhost:5000",
  "http://127.0.0.1:5000"
].filter((v, i, arr) => v !== undefined && arr.indexOf(v) === i);

const STREAM_RULES = [
  {
    name: "Engineering",
    blurb: "B.Tech, M.Tech, MCA and technical pathways.",
    tags: ["engineering", "technology", "b.tech", "m.tech", "mca", "polytechnic"]
  },
  {
    name: "Arts & Science",
    blurb: "BA, BSc, BCom, MA, MSc and core degree tracks.",
    tags: ["arts", "science", "bsc", "ba", "bcom", "msc", "mcom", "ma", "commerce"]
  },
  {
    name: "Management",
    blurb: "BBA, MBA and business-focused programs.",
    tags: ["management", "business", "mba", "bba", "pgdm"]
  },
  {
    name: "Medical",
    blurb: "MBBS and allied health academic tracks.",
    tags: ["medical", "mbbs", "nursing", "pharmacy", "dental", "health"]
  },
  {
    name: "Law",
    blurb: "LLB, LLM and legal studies options.",
    tags: ["law", "llb", "llm", "legal"]
  },
  {
    name: "Research",
    blurb: "PhD and advanced research opportunities.",
    tags: ["phd", "research", "doctorate", "scholar"]
  }
];

const state = {
  colleges: [],
  activeStream: "",
  query: ""
};

const elements = {
  searchInput: document.getElementById("programSearchInput"),
  clearBtn: document.getElementById("programClearBtn"),
  status: document.getElementById("programStatus"),
  summary: document.getElementById("programSummary"),
  streamChips: document.getElementById("programStreamChips"),
  grid: document.getElementById("programGrid")
};

function normalizeCollege(c) {
  return {
    id: c.id || c.name,
    name: c.name || "Unknown College",
    city: c.city || "Unknown City",
    district: c.district || "Unknown District",
    category: c.category || "",
    type: c.type || "",
    rating: Number(c.rating) || 0,
    averageFees: Number(c.averageFees) || 0,
    popularCourses: Array.isArray(c.popularCourses) ? c.popularCourses : []
  };
}

function inferStreams(college) {
  const searchable = `${college.category} ${college.type} ${college.popularCourses.join(" ")}`.toLowerCase();
  const matches = STREAM_RULES.filter((rule) => rule.tags.some((tag) => searchable.includes(tag))).map(
    (rule) => rule.name
  );
  return matches.length ? matches : ["Arts & Science"];
}

async function fetchAllFromApi(base) {
  const firstRes = await fetch(`${base}/api/colleges?page=1&limit=250`);
  if (!firstRes.ok) return null;
  const firstPayload = await firstRes.json();
  if (!firstPayload.data || !Array.isArray(firstPayload.data)) return null;

  const totalPages = firstPayload.pagination?.totalPages || 1;
  let all = [...firstPayload.data];
  for (let p = 2; p <= totalPages; p += 1) {
    const res = await fetch(`${base}/api/colleges?page=${p}&limit=250`);
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

function getStreamStats() {
  return STREAM_RULES.map((rule) => {
    const colleges = state.colleges
      .filter((c) => inferStreams(c).includes(rule.name))
      .sort((a, b) => b.rating - a.rating);
    return {
      ...rule,
      colleges,
      count: colleges.length,
      avgFees: colleges.length
        ? Math.round(colleges.reduce((sum, c) => sum + c.averageFees, 0) / colleges.length)
        : 0
    };
  });
}

function rankingsLink(stream) {
  return `rankings.html?stream=${encodeURIComponent(stream)}`;
}

function renderChips(stats) {
  const allChip = `<button class="chip program-stream-chip ${state.activeStream ? "" : "active"}" data-stream="">All Streams</button>`;
  const streamChips = stats
    .map(
      (s) =>
        `<button class="chip program-stream-chip ${state.activeStream === s.name ? "active" : ""}" data-stream="${s.name}">${s.name} (${s.count})</button>`
    )
    .join("");
  elements.streamChips.innerHTML = allChip + streamChips;
}

function renderSummary(stats) {
  const shownCount = stats.length;
  const totalPrograms = STREAM_RULES.length;
  const totalColleges = stats.reduce((sum, s) => sum + s.count, 0);
  const topStream = [...stats].sort((a, b) => b.count - a.count)[0]?.name || "-";

  elements.summary.innerHTML = `
    <article class="summary-card"><p class="label">Streams Shown</p><p class="value">${shownCount}/${totalPrograms}</p></article>
    <article class="summary-card"><p class="label">Program Matches</p><p class="value">${totalColleges}</p></article>
    <article class="summary-card"><p class="label">Most Available</p><p class="value">${topStream}</p></article>
  `;
}

function cardTemplate(s) {
  const top = s.colleges.slice(0, 3);
  return `
    <article class="explore-card program-card">
      <h3>${s.name}</h3>
      <p class="body-text">${s.blurb}</p>
      <p class="program-meta">${s.count} colleges | Avg Fees: INR ${s.avgFees.toLocaleString()}</p>
      <div class="program-top-list">
        ${
          top.length
            ? top
              .map(
                (c) =>
                  `<a class="chip" href="college.html?id=${encodeURIComponent(c.id)}">${c.name}</a>`
              )
              .join("")
            : "<span class='requested-item'>No colleges found</span>"
        }
      </div>
      <div class="landing-actions">
        <a class="btn-primary" href="${rankingsLink(s.name)}">Open in Colleges</a>
      </div>
    </article>
  `;
}

function render() {
  const allStats = getStreamStats();
  const q = state.query.trim().toLowerCase();
  const visible = allStats.filter((s) => {
    const streamMatch = !state.activeStream || s.name === state.activeStream;
    const queryMatch = !q || s.name.toLowerCase().includes(q);
    return streamMatch && queryMatch;
  });

  renderChips(allStats);
  renderSummary(visible);
  elements.grid.innerHTML = visible.length
    ? visible.map(cardTemplate).join("")
    : "<p class='body-text'>No stream matches your search.</p>";
}

function bindEvents() {
  elements.searchInput.addEventListener("input", () => {
    state.query = elements.searchInput.value;
    render();
  });

  elements.clearBtn.addEventListener("click", () => {
    state.query = "";
    state.activeStream = "";
    elements.searchInput.value = "";
    render();
  });

  elements.streamChips.addEventListener("click", (event) => {
    const chip = event.target.closest(".program-stream-chip");
    if (!chip) return;
    state.activeStream = chip.dataset.stream || "";
    render();
  });
}

async function init() {
  state.colleges = await loadColleges();
  bindEvents();
  render();
}

init();
