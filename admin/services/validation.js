function parseNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeText(value, fallback = "") {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function isValidUrl(url) {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (error) {
    return false;
  }
}

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function validateCollegePayload(payload = {}, options = {}) {
  const partial = Boolean(options.partial);
  const errors = [];
  const out = {};

  const requiredFields = ["name", "district", "city", "type"];
  requiredFields.forEach((field) => {
    if (!partial || payload[field] !== undefined) {
      const value = normalizeText(payload[field]);
      if (!value) errors.push(`${field} is required`);
      out[field] = value;
    }
  });

  const textFields = ["university", "category", "nirfBand", "about", "image", "naacGrade", "naacCycle", "naacSource"];
  textFields.forEach((field) => {
    if (!partial || payload[field] !== undefined) {
      out[field] = normalizeText(payload[field]);
    }
  });

  if (!partial || payload.website !== undefined) {
    const website = normalizeText(payload.website);
    if (!isValidUrl(website)) errors.push("website must be a valid http/https URL");
    out.website = website;
  }

  if (!partial || payload.established !== undefined) {
    const established = parseNumber(payload.established, 0);
    if (established < 0) errors.push("established must be a positive number");
    out.established = established || null;
  }

  if (!partial || payload.rating !== undefined) {
    const rating = parseNumber(payload.rating, 0);
    if (rating < 0 || rating > 5) errors.push("rating must be between 0 and 5");
    out.rating = Math.max(0, Math.min(5, rating));
  }

  if (!partial || payload.averageFees !== undefined) {
    const fees = parseNumber(payload.averageFees, 0);
    if (fees < 0) errors.push("averageFees cannot be negative");
    out.averageFees = Math.max(0, fees);
  }

  if (!partial || payload.naacCgpa !== undefined) {
    const cgpa = parseNumber(payload.naacCgpa, 0);
    if (cgpa < 0 || cgpa > 4) errors.push("naacCgpa must be between 0 and 4");
    out.naacCgpa = Math.max(0, Math.min(4, cgpa));
  }

  if (!partial || payload.naacYear !== undefined) {
    const year = parseNumber(payload.naacYear, 0);
    out.naacYear = year > 1900 ? year : null;
  }

  if (!partial || payload.popularCourses !== undefined) {
    out.popularCourses = normalizeArray(payload.popularCourses);
  }

  if (!partial || payload.placements !== undefined || payload.highestPackageLPA !== undefined || payload.averagePackageLPA !== undefined) {
    const placementsSource = payload.placements && typeof payload.placements === "object" ? payload.placements : {};
    const highestRaw = payload.highestPackageLPA !== undefined ? payload.highestPackageLPA : placementsSource.highestPackageLPA;
    const averageRaw = payload.averagePackageLPA !== undefined ? payload.averagePackageLPA : placementsSource.averagePackageLPA;

    const highest = parseNumber(highestRaw, 0);
    const average = parseNumber(averageRaw, 0);

    if (highest < 0) errors.push("highestPackageLPA cannot be negative");
    if (average < 0) errors.push("averagePackageLPA cannot be negative");

    out.placements = {
      highestPackageLPA: Math.max(0, highest),
      averagePackageLPA: Math.max(0, average)
    };
  }

  if (!partial || payload.id !== undefined) {
    out.id = slugify(payload.id || payload.name);
  }

  return {
    value: out,
    errors
  };
}

module.exports = {
  validateCollegePayload,
  slugify
};
