const AUTH_KEY = "kch_auth";
const USER_KEY = "kch_user";
const USERS_KEY = "kch_users";
const ADMIN_USERNAME = "alaf15123456789@gmail.com";
const ADMIN_TYPO_USERNAME = "alaf15123456789@gamil.com";

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
  window.location.reload();
}

function updateNavAuth() {
  const nav = document.querySelector(".site-nav nav");
  if (!nav) return;

  // Remove existing auth dynamic elements if any
  nav.querySelectorAll(".auth-element").forEach((node) => node.remove());

  if (isLoggedIn()) {
    const user = localStorage.getItem(USER_KEY) || "Student";
    const displayName = user.includes("@") ? user.split("@")[0] : user;

    const nameNode = document.createElement("span");
    nameNode.className = "auth-name auth-element";
    nameNode.textContent = displayName;
    nameNode.title = user;

    const logoutBtn = document.createElement("button");
    logoutBtn.className = "chip auth-element";
    logoutBtn.textContent = "Logout";
    logoutBtn.style.cursor = "pointer";
    logoutBtn.addEventListener("click", logout);

    nav.appendChild(nameNode);
    nav.appendChild(logoutBtn);
  } else {
    const loginLink = document.createElement("a");
    loginLink.className = "auth-element";
    loginLink.href = "login.html";
    loginLink.textContent = "Sign In";

    const signupLink = document.createElement("a");
    signupLink.className = "chip auth-element";
    signupLink.href = "signup.html";
    signupLink.textContent = "Sign Up";

    nav.appendChild(loginLink);
    nav.appendChild(signupLink);
  }
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
  const exists = users.some((u) => String(u.email || "").toLowerCase() === email.toLowerCase());
  if (exists) return { ok: false, message: "Email already registered. Please login." };
  users.push({ email, password });
  setUsers(users);
  return { ok: true };
}

function validateLogin(email, password) {
  const users = getUsers();
  const found = users.find((u) => String(u.email || "").toLowerCase() === email.toLowerCase());
  if (!found) return { ok: false, message: "Account not found. Please sign up first." };
  if (found.password !== password) return { ok: false, message: "Wrong password." };
  return { ok: true };
}

function handleLoginPage() {
  if (isLoggedIn()) {
    const next = new URLSearchParams(window.location.search).get("next") || "index.html";
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
      if (errorEl) errorEl.textContent = "Enter email and password.";
      return;
    }

    const emailLower = email.toLowerCase();
    if (emailLower === ADMIN_USERNAME.toLowerCase() || emailLower === ADMIN_TYPO_USERNAME.toLowerCase()) {
      window.location.href = "/admin";
      return;
    }

    const result = validateLogin(email, password);
    if (!result.ok) {
      if (errorEl) errorEl.textContent = result.message;
      return;
    }
    setLoggedIn(email);
    const next = new URLSearchParams(window.location.search).get("next") || "index.html";
    window.location.href = next;
  });
}

function handleSignupPage() {
  if (isLoggedIn()) {
    window.location.href = "index.html";
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
      if (errorEl) errorEl.textContent = "Fill all fields.";
      return;
    }
    if (password.length < 6) {
      if (errorEl) errorEl.textContent = "Password must be at least 6 characters.";
      return;
    }
    if (password !== confirm) {
      if (errorEl) errorEl.textContent = "Passwords do not match.";
      return;
    }

    const result = registerUser(email, password);
    if (!result.ok) {
      if (errorEl) errorEl.textContent = result.message;
      return;
    }
    setLoggedIn(email);
    window.location.href = "index.html";
  });
}


function injectBackToTop() {
  if (document.querySelector(".back-to-top-btn")) return;
  const btn = document.createElement("button");
  btn.className = "back-to-top-btn";
  btn.setAttribute("aria-label", "Scroll back to top");
  btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>';

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      btn.classList.add("is-visible");
    } else {
      btn.classList.remove("is-visible");
    }
  }, { passive: true });

  document.body.appendChild(btn);
}

function initAuth() {
  const path = window.location.pathname.toLowerCase();
  const isLogin = path.endsWith("/login.html") || path.endsWith("/login") || path === "/login.html" || path === "/login";
  const isSignup = path.endsWith("/signup.html") || path.endsWith("/signup") || path === "/signup.html" || path === "/signup";

  if (isLogin) {
    handleLoginPage();
    return;
  }
  if (isSignup) {
    handleSignupPage();
    return;
  }

  updateNavAuth();
  injectBackToTop();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAuth);
} else {
  initAuth();
}
