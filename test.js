const http = require("http");
const app = require("./server");

const TEST_PORT = 5055;
const BASE_URL = `http://localhost:${TEST_PORT}`;

let server;
let adminCookie = "";

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = options.headers || {};
  if (adminCookie && !headers.Cookie) {
    headers.Cookie = adminCookie;
  }

  const res = await fetch(url, {
    ...options,
    headers
  });

  const contentType = res.headers.get("content-type") || "";
  let body = null;
  if (contentType.includes("application/json")) {
    body = await res.json();
  } else {
    body = await res.text();
  }

  // capture set-cookie if any
  const setCookie = res.headers.get("set-cookie");
  if (setCookie && setCookie.includes("admin_token=")) {
    adminCookie = setCookie.split(";")[0];
  }

  return { status: res.status, headers: res.headers, body, contentType };
}

async function runTests() {
  console.log("==========================================");
  console.log(" Running Kerala College Hub Test Suite");
  console.log("==========================================\n");

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`• ${name}... `);
      await fn();
      console.log("✓ PASSED");
      passed += 1;
    } catch (err) {
      console.log("✗ FAILED");
      console.error(`  Error: ${err.message}`);
      failed += 1;
    }
  }

  // 1. Static and clean route endpoints
  await test("GET / serves index.html", async () => {
    const res = await request("/");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.includes("Kerala College Hub"), "Expected page title/brand in HTML");
  });

  await test("GET /rankings serves rankings.html", async () => {
    const res = await request("/rankings");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.includes("Student Explorer"), "Expected rankings content");
  });

  await test("GET /naac-rankings serves naac-rankings.html", async () => {
    const res = await request("/naac-rankings");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.includes("NAAC-Based College Rankings"), "Expected NAAC content");
  });

  await test("GET /programs serves programs.html", async () => {
    const res = await request("/programs");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.includes("Explore Programs by Stream"), "Expected Programs content");
  });

  await test("GET /decision-guide serves decision-guide.html", async () => {
    const res = await request("/decision-guide");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.includes("Student Decision Guide"), "Expected Decision Guide content");
  });

  await test("GET /about serves about.html", async () => {
    const res = await request("/about");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.includes("About Our Platform"), "Expected About content");
  });

  await test("GET /contact serves contact.html", async () => {
    const res = await request("/contact");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.includes("Get in Touch"), "Expected Contact content");
  });

  await test("GET /admin serves admin index.html", async () => {
    const res = await request("/admin");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.includes("Admin Portal"), "Expected Admin Portal title");
  });

  // 2. Direct data static file serving
  await test("GET /data/colleges.json returns JSON file directly", async () => {
    const res = await request("/data/colleges.json");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.body), "Expected colleges array");
    assert(res.body.length >= 200, `Expected at least 200 colleges, got ${res.body.length}`);
  });

  // 3. Public REST APIs
  await test("GET /api/meta returns districts, types, courses", async () => {
    const res = await request("/api/meta");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.body.districts) && res.body.districts.length > 0, "Missing districts");
    assert(Array.isArray(res.body.types) && res.body.types.length > 0, "Missing types");
    assert(Array.isArray(res.body.courses) && res.body.courses.length > 0, "Missing courses");
  });

  await test("GET /api/colleges with pagination and limit=500", async () => {
    const res = await request("/api/colleges?limit=500");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.body.data), "Expected data array");
    assert(res.body.pagination.total >= 200, "Expected total >= 200");
    assert(res.body.data.length >= 200, `Expected all colleges in one page with limit=500, got ${res.body.data.length}`);
  });

  await test("GET /api/colleges filters by district", async () => {
    const res = await request("/api/colleges?district=Kozhikode&limit=100");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.every((c) => c.district === "Kozhikode"), "All colleges must be from Kozhikode");
  });

  await test("GET /api/colleges/:id retrieves single college", async () => {
    const res = await request("/api/colleges/nit-calicut");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.id === "nit-calicut", "Expected nit-calicut ID");
    assert(res.body.name.includes("National Institute of Technology"), "Expected NIT Calicut name");
  });

  await test("GET /api/colleges/:id with unknown ID returns 404", async () => {
    const res = await request("/api/colleges/non-existent-college-xyz");
    assert(res.status === 404, `Expected 404, got ${res.status}`);
  });

  // 4. Contact form API
  await test("POST /api/contact/send saves valid contact message", async () => {
    const res = await request("/api/contact/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Student",
        email: "student@test.com",
        message: "Can you provide more information about KEAM cutoff ranks?"
      })
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data?.name === "Test Student", "Expected saved message data");
  });

  await test("POST /api/contact/send validates fields", async () => {
    const res = await request("/api/contact/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "", email: "not-an-email", message: "Hi" })
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  // 5. Admin Authentication
  await test("POST /api/admin/auth/login fails on invalid credentials", async () => {
    const res = await request("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "wrong@admin.com", password: "wrongpassword" })
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await test("POST /api/admin/auth/login succeeds with alaf15123456789@gmail.com", async () => {
    const res = await request("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "alaf15123456789@gmail.com", password: "Admin@12345" })
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.user.role === "admin", "Expected role admin");
    assert(adminCookie.length > 0, "Expected admin_token cookie to be set");
  });

  await test("GET /api/admin/auth/me returns current admin session", async () => {
    const res = await request("/api/admin/auth/me");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.user.role === "admin", "Expected admin session user");
  });

  // 6. Admin College CRUD
  let createdCollegeId = "";
  await test("POST /api/admin/colleges creates a new college", async () => {
    const testCollege = {
      name: "Automated Test College",
      district: "Ernakulam",
      city: "Kochi",
      type: "Autonomous",
      university: "MG University",
      category: "Engineering",
      rating: 4.5,
      averageFees: 85000,
      website: "https://example.edu",
      popularCourses: ["B.Tech", "MCA"],
      about: "A temporary test college created during automated testing.",
      naacGrade: "A+",
      naacCgpa: 3.42,
      naacYear: 2024
    };

    const res = await request("/api/admin/colleges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testCollege)
    });

    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.data?.name === "Automated Test College", "College created with correct name");
    assert(res.body.data?.naacGrade === "A+", "NAAC grade preserved");
    createdCollegeId = res.body.data.id;
  });

  await test("PUT /api/admin/colleges/:id updates the college", async () => {
    assert(createdCollegeId, "Missing createdCollegeId from previous test");
    const res = await request(`/api/admin/colleges/${createdCollegeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: 4.9,
        averageFees: 90000,
        naacGrade: "A++",
        naacCgpa: 3.75
      })
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data?.rating === 4.9, "Expected updated rating");
    assert(res.body.data?.naacGrade === "A++", "Expected updated NAAC grade");
  });

  await test("DELETE /api/admin/colleges/:id removes the college", async () => {
    assert(createdCollegeId, "Missing createdCollegeId");
    const res = await request(`/api/admin/colleges/${createdCollegeId}`, {
      method: "DELETE"
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);

    const verify = await request(`/api/colleges/${createdCollegeId}`);
    assert(verify.status === 404, "Deleted college should not be found");
  });

  // 7. Admin messages endpoint
  await test("GET /api/admin/messages lists contact messages", async () => {
    const res = await request("/api/admin/messages");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.body.data), "Expected messages data array");
    assert(res.body.data.length > 0, "Expected at least 1 message from earlier test");
  });

  // 8. Admin logout
  await test("POST /api/admin/auth/logout invalidates session", async () => {
    const res = await request("/api/admin/auth/logout", { method: "POST" });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  console.log("\n==========================================");
  console.log(` Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log("==========================================");

  if (failed > 0) {
    process.exit(1);
  }
}

server = http.createServer(app);
server.listen(TEST_PORT, async () => {
  try {
    await runTests();
  } catch (err) {
    console.error("Test runner error:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    process.exit(process.exitCode || 0);
  }
});
