const AUTH_KEY = "kch_auth";
const USER_KEY = "kch_user";
const USERS_KEY = "kch_users";
const ADMIN_USERNAME = "alaf15123456789@gamil.com";

function isLoggedIn() {
  return localStorage.getItem(AUTH_KEY) === "1";
}

function setLoggedIn(email) {
  localStorage.setItem(AUTH_KEY, "1");
  localStorage.setItem(USER_KEY, email);
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = "/login.html";
}

function injectNavAuth() {
  const nav = document.querySelector(".site-nav nav");
  if (!nav) return;

  const name = localStorage.getItem(USER_KEY) || "Student";
  const nameNode = document.createElement("span");
  nameNode.className = "auth-name";
  nameNode.textContent = name;

  const logoutBtn = document.createElement("button");
  logoutBtn.className = "chip";
  logoutBtn.textContent = "Logout";
  logoutBtn.addEventListener("click", logout);

  nav.appendChild(nameNode);
  nav.appendChild(logoutBtn);
}

function getUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function setUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function registerUser(email, password) {
  const users = getUsers();
  const exists = users.some((u) => String(u.email).toLowerCase() === email.toLowerCase());
  if (exists) return { ok: false, message: "Email already registered. Please login." };
  users.push({ email, password });
  setUsers(users);
  return { ok: true };
}

function validateLogin(email, password) {
  const users = getUsers();
  const found = users.find((u) => String(u.email).toLowerCase() === email.toLowerCase());
  if (!found) return { ok: false, message: "Account not found. Please sign up first." };
  if (found.password !== password) return { ok: false, message: "Wrong password." };
  return { ok: true };
}

function handleLoginPage() {
  if (isLoggedIn()) {
    const next = new URLSearchParams(window.location.search).get("next") || "/index.html";
    window.location.href = next;
    return;
  }

  const form = document.getElementById("loginForm");
  if (!form) return;
  const emailEl = document.getElementById("loginEmail");
  const passwordEl = document.getElementById("loginPassword");
  const errorEl = document.getElementById("loginError");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = emailEl.value.trim();
    const password = passwordEl.value.trim();
    if (!email || !password) {
      errorEl.textContent = "Enter email and password.";
      return;
    }

    if (email.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
      window.location.href = "/admin-login";
      return;
    }

    const result = validateLogin(email, password);
    if (!result.ok) {
      errorEl.textContent = result.message;
      return;
    }
    setLoggedIn(email);
    const next = new URLSearchParams(window.location.search).get("next") || "/index.html";
    window.location.href = next;
  });
}

function handleSignupPage() {
  if (isLoggedIn()) {
    window.location.href = "/index.html";
    return;
  }

  const form = document.getElementById("signupForm");
  if (!form) return;
  const emailEl = document.getElementById("signupEmail");
  const passwordEl = document.getElementById("signupPassword");
  const confirmEl = document.getElementById("signupConfirmPassword");
  const errorEl = document.getElementById("signupError");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = emailEl.value.trim();
    const password = passwordEl.value.trim();
    const confirm = confirmEl.value.trim();

    if (!email || !password || !confirm) {
      errorEl.textContent = "Fill all fields.";
      return;
    }
    if (password.length < 6) {
      errorEl.textContent = "Password must be at least 6 characters.";
      return;
    }
    if (password !== confirm) {
      errorEl.textContent = "Passwords do not match.";
      return;
    }

    const result = registerUser(email, password);
    if (!result.ok) {
      errorEl.textContent = result.message;
      return;
    }
    setLoggedIn(email);
    window.location.href = "/index.html";
  });
}

function protectPage() {
  const path = window.location.pathname.toLowerCase();
  const isLogin = path.endsWith("/login.html") || path === "/login.html";
  const isSignup = path.endsWith("/signup.html") || path === "/signup.html";
  if (isLogin) {
    handleLoginPage();
    return;
  }
  if (isSignup) {
    handleSignupPage();
    return;
  }

  if (!isLoggedIn()) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login.html?next=${next}`;
    return;
  }
  injectNavAuth();
}

protectPage();
