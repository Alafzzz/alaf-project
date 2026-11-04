const state = {
  colleges: [],
  filtered: [],
  messages: [],
  user: null
};

const el = {
  loginView: document.getElementById("loginView"),
  adminView: document.getElementById("adminView"),
  loginForm: document.getElementById("loginForm"),
  signupForm: document.getElementById("signupForm"),
  loginError: document.getElementById("loginError"),
  signupError: document.getElementById("signupError"),
  welcomeText: document.getElementById("welcomeText"),
  logoutBtn: document.getElementById("logoutBtn"),
  navButtons: Array.from(document.querySelectorAll(".nav-btn")),
  panels: Array.from(document.querySelectorAll(".panel")),
  addCollegeForm: document.getElementById("addCollegeForm"),
  addFormMessage: document.getElementById("addFormMessage"),
  manageSearch: document.getElementById("manageSearch"),
  collegeList: document.getElementById("collegeList"),
  messageList: document.getElementById("messageList"),
  messagesCount: document.getElementById("messagesCount"),
  totalColleges: document.getElementById("totalColleges"),
  avgFees: document.getElementById("avgFees"),
  topDistrict: document.getElementById("topDistrict"),
  editDialog: document.getElementById("editDialog"),
  editCollegeForm: document.getElementById("editCollegeForm"),
  editFormMessage: document.getElementById("editFormMessage"),
  closeEditDialog: document.getElementById("closeEditDialog"),
  toast: document.getElementById("toast"),
  modeButtons: Array.from(document.querySelectorAll(".mode-toggle")),
  loginFormPanel: document.getElementById("loginFormPanel"),
  signupFormPanel: document.getElementById("signupFormPanel")
};

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {})
    },
    ...options
  });

  let data = {};
  try {
    data = await response.json();
  } catch (error) {
    data = {};
  }

  if (!response.ok) {
    const message = data.message || "Request failed";
    const details = Array.isArray(data.errors) && data.errors.length ? ` (${data.errors.join(", ")})` : "";
    throw new Error(`${message}${details}`);
  }

  return data;
}

function toast(message, isError = false) {
  el.toast.textContent = message;
  el.toast.style.background = isError ? "rgba(185, 28, 28, 0.9)" : "rgba(15, 23, 42, 0.88)";
  el.toast.classList.add("show");
  window.setTimeout(() => el.toast.classList.remove("show"), 2600);
}

function showLogin() {
  el.loginView.classList.remove("hidden");
  el.adminView.classList.add("hidden");
}

function showAdmin() {
  el.loginView.classList.add("hidden");
  el.adminView.classList.remove("hidden");
}

function setActivePanel(panelId) {
  el.navButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.target === panelId));
  el.panels.forEach((panel) => panel.classList.toggle("panel-active", panel.id === panelId));
}

function parseCourses(value) {
  return String(value || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function collegePayloadFromForm(form) {
  const fd = new FormData(form);
  return {
    name: fd.get("name"),
    district: fd.get("district"),
    city: fd.get("city"),
    type: fd.get("type"),
    university: fd.get("university") || "",
    category: fd.get("category") || "",
    established: Number(fd.get("established")) || 0,
    rating: Number(fd.get("rating")) || 0,
    averageFees: Number(fd.get("averageFees")) || 0,
    website: fd.get("website") || "",
    popularCourses: parseCourses(fd.get("popularCourses")),
    about: fd.get("about") || "",
    highestPackageLPA: Number(fd.get("highestPackageLPA")) || 0,
    averagePackageLPA: Number(fd.get("averagePackageLPA")) || 0,
    naacGrade: fd.get("naacGrade") || "",
    naacCgpa: Number(fd.get("naacCgpa")) || 0,
    naacYear: Number(fd.get("naacYear")) || null
  };
}

function validatePayload(payload) {
  const missing = ["name", "district", "city", "type"].filter((field) => !String(payload[field] || "").trim());
  if (missing.length) {
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }
  if (payload.rating < 0 || payload.rating > 5) {
    throw new Error("Rating must be between 0 and 5");
  }
}

async function uploadImage(file) {
  if (!file || !file.size) return "";
  const formData = new FormData();
  formData.append("image", file);
  const response = await api("/api/admin/colleges/upload", {
    method: "POST",
    body: formData,
    headers: {}
  });
  return response.imageUrl || "";
}

function renderStats() {
  const list = state.colleges;
  const total = list.length;
  const avgFees = total ? Math.round(list.reduce((sum, c) => sum + (Number(c.averageFees) || 0), 0) / total) : 0;
  const districtMap = list.reduce((acc, c) => {
    const key = c.district || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const topDistrict = Object.entries(districtMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

  el.totalColleges.textContent = String(total);
  el.avgFees.textContent = `INR ${avgFees.toLocaleString()}`;
  el.topDistrict.textContent = topDistrict;
}

function cardTemplate(college) {
  const image = college.image ? `<img src="${college.image}" alt="${college.name}" class="college-thumb" />` : "";
  const naacBadge = college.naacGrade ? `<small class="badge">NAAC ${college.naacGrade}${college.naacCgpa ? ` (${college.naacCgpa})` : ""}</small>` : "";
  return `
    <article class="college-card fade-in">
      ${image}
      <div class="college-card-head">
        <div>
          <h4>${college.name}</h4>
          <small>${college.city || "-"}, ${college.district || "-"} | ${college.type || "-"}</small>
        </div>
        <strong>${Number(college.rating || 0).toFixed(1)}</strong>
      </div>
      <small>Fees: INR ${(Number(college.averageFees) || 0).toLocaleString()} | Courses: ${(college.popularCourses || []).join(", ") || "N/A"}</small>
      ${naacBadge}
      <div class="college-card-actions">
        <button class="btn btn-secondary" data-action="edit" data-id="${college.id}">Edit</button>
        <button class="btn btn-secondary" data-action="delete" data-id="${college.id}">Delete</button>
      </div>
    </article>
  `;
}

function renderCollegeList() {
  const query = String(el.manageSearch.value || "").toLowerCase().trim();
  state.filtered = state.colleges.filter((college) => {
    if (!query) return true;
    return [college.name, college.city, college.district].some((value) => String(value || "").toLowerCase().includes(query));
  });

  if (!state.filtered.length) {
    el.collegeList.innerHTML = "<p>No colleges match your search.</p>";
    return;
  }

  el.collegeList.innerHTML = state.filtered.map(cardTemplate).join("");
}

function messageTemplate(item) {
  const created = item.createdAt ? new Date(item.createdAt).toLocaleString() : "-";
  return `
    <article class="message-card fade-in">
      <div class="message-head">
        <strong>${item.name || "Unknown"}</strong>
        <small>${created}</small>
      </div>
      <small>Email: ${item.email || "-"}</small>
      <p>${item.message || ""}</p>
    </article>
  `;
}

function renderMessages() {
  const list = Array.isArray(state.messages) ? state.messages : [];
  el.messagesCount.textContent = `${list.length} message(s)`;
  if (!list.length) {
    el.messageList.innerHTML = "<p>No contact messages yet.</p>";
    return;
  }
  el.messageList.innerHTML = list.map(messageTemplate).join("");
}

async function loadColleges() {
  const response = await api("/api/admin/colleges");
  state.colleges = Array.isArray(response.data) ? response.data : [];
  renderStats();
  renderCollegeList();
}

async function loadMessages() {
  const response = await api("/api/admin/messages");
  state.messages = Array.isArray(response.data) ? response.data : [];
  renderMessages();
}

function openEditDialog(college) {
  const form = el.editCollegeForm;
  form.elements.id.value = college.id || "";
  form.elements.name.value = college.name || "";
  form.elements.district.value = college.district || "";
  form.elements.city.value = college.city || "";
  form.elements.type.value = college.type || "";
  if (form.elements.university) form.elements.university.value = college.university || "";
  if (form.elements.category) form.elements.category.value = college.category || "";
  form.elements.averageFees.value = Number(college.averageFees) || 0;
  form.elements.rating.value = Number(college.rating) || 0;
  if (form.elements.naacGrade) form.elements.naacGrade.value = college.naacGrade || "";
  if (form.elements.naacCgpa) form.elements.naacCgpa.value = college.naacCgpa || "";
  if (form.elements.naacYear) form.elements.naacYear.value = college.naacYear || "";
  form.elements.popularCourses.value = Array.isArray(college.popularCourses) ? college.popularCourses.join(", ") : "";
  form.elements.website.value = college.website || "";
  form.elements.about.value = college.about || "";
  el.editFormMessage.textContent = "";
  el.editDialog.showModal();
}

async function deleteCollege(id) {
  const ok = window.confirm("Delete this college record? This cannot be undone.");
  if (!ok) return;
  await api(`/api/admin/colleges/${encodeURIComponent(id)}`, { method: "DELETE" });
  toast("College deleted");
  await loadColleges();
}

async function handleLogin(event) {
  event.preventDefault();
  el.loginError.textContent = "";
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  try {
    const response = await api("/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
    state.user = response.user;
    el.welcomeText.textContent = `Welcome, ${state.user.username}. Manage records safely.`;
    showAdmin();
    await loadColleges();
    await loadMessages();
    toast("Logged in successfully");
  } catch (error) {
    el.loginError.textContent = error.message;
  }
}

function setAuthMode(mode) {
  const isLogin = mode === "login";

  el.modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });

  el.loginFormPanel.classList.toggle("hidden", !isLogin);
  el.signupFormPanel.classList.toggle("hidden", isLogin);
  el.loginError.textContent = "";
  el.signupError.textContent = "";
}

async function handleSignup(event) {
  event.preventDefault();
  el.signupError.textContent = "";

  const username = document.getElementById("signupUsername").value.trim();
  const password = document.getElementById("signupPassword").value;
  const confirm = document.getElementById("signupConfirmPassword").value;

  try {
    if (!username || !password) {
      throw new Error("Username and password are required.");
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }
    if (password !== confirm) {
      throw new Error("Passwords do not match.");
    }

    const response = await api("/api/admin/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });

    state.user = response.user;
    el.welcomeText.textContent = `Welcome, ${state.user.username}. Manage records safely.`;
    showAdmin();
    await loadColleges();
    await loadMessages();
    toast("Admin account created");
  } catch (error) {
    el.signupError.textContent = error.message;
    toast(error.message, true);
  }
}

async function checkSession() {
  try {
    const response = await api("/api/admin/auth/me");
    state.user = response.user;
    el.welcomeText.textContent = `Welcome, ${state.user.username}. Manage records safely.`;
    showAdmin();
    await loadColleges();
    await loadMessages();
  } catch (error) {
    showLogin();
  }
}

async function handleAddCollege(event) {
  event.preventDefault();
  el.addFormMessage.textContent = "";

  try {
    const payload = collegePayloadFromForm(el.addCollegeForm);
    validatePayload(payload);

    const fileInput = el.addCollegeForm.elements.imageFile;
    const file = fileInput && fileInput.files ? fileInput.files[0] : null;
    if (file && file.size) payload.image = await uploadImage(file);

    await api("/api/admin/colleges", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    el.addCollegeForm.reset();
    el.addFormMessage.textContent = "College added successfully.";
    setActivePanel("manageSection");
    toast("College saved");
    await loadColleges();
  } catch (error) {
    el.addFormMessage.textContent = error.message;
    toast(error.message, true);
  }
}

async function handleEditCollege(event) {
  event.preventDefault();
  el.editFormMessage.textContent = "";

  try {
    const form = el.editCollegeForm;
    const id = form.elements.id.value;
    const payload = {
      name: form.elements.name.value,
      district: form.elements.district.value,
      city: form.elements.city.value,
      type: form.elements.type.value,
      university: form.elements.university ? form.elements.university.value : "",
      category: form.elements.category ? form.elements.category.value : "",
      averageFees: Number(form.elements.averageFees.value) || 0,
      rating: Number(form.elements.rating.value) || 0,
      naacGrade: form.elements.naacGrade ? form.elements.naacGrade.value : "",
      naacCgpa: form.elements.naacCgpa ? Number(form.elements.naacCgpa.value) || 0 : 0,
      naacYear: form.elements.naacYear ? Number(form.elements.naacYear.value) || null : null,
      popularCourses: parseCourses(form.elements.popularCourses.value),
      website: form.elements.website.value,
      about: form.elements.about.value
    };

    validatePayload(payload);

    const fileInput = form.elements.imageFile;
    const file = fileInput && fileInput.files ? fileInput.files[0] : null;
    if (file && file.size) payload.image = await uploadImage(file);

    await api(`/api/admin/colleges/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });

    el.editDialog.close();
    toast("College updated");
    await loadColleges();
  } catch (error) {
    el.editFormMessage.textContent = error.message;
    toast(error.message, true);
  }
}

async function handleLogout() {
  try {
    await api("/api/admin/auth/logout", { method: "POST" });
  } catch (error) {
    // Ignore logout errors and clear client view.
  }
  state.user = null;
  showLogin();
  toast("Logged out");
}

function bindEvents() {
  el.loginForm.addEventListener("submit", handleLogin);
  el.logoutBtn.addEventListener("click", handleLogout);
  el.addCollegeForm.addEventListener("submit", handleAddCollege);
  el.editCollegeForm.addEventListener("submit", handleEditCollege);
  el.closeEditDialog.addEventListener("click", () => el.editDialog.close());
  el.manageSearch.addEventListener("input", renderCollegeList);

  el.navButtons.forEach((btn) => {
    btn.addEventListener("click", () => setActivePanel(btn.dataset.target));
  });

  el.collegeList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const id = button.dataset.id;
    const college = state.colleges.find((item) => item.id === id);
    if (!college) return;

    if (action === "edit") {
      openEditDialog(college);
      return;
    }

    if (action === "delete") {
      try {
        await deleteCollege(id);
      } catch (error) {
        toast(error.message, true);
      }
    }
  });

  el.modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      setAuthMode(btn.dataset.mode);
    });
  });

  el.signupForm.addEventListener("submit", handleSignup);
}

bindEvents();
checkSession();
setAuthMode("login");
