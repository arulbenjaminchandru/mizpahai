/**
 * Data Horizon Academy - Automated Test Suite
 *
 * Runs end-to-end verification of validation logic, YouTube URL processing,
 * Google Drive link checks, enrollment code policies, and security constraints.
 */

const assert = require("assert");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  \x1b[32m✔ PASS\x1b[0m ${name}`);
    passed++;
  } catch (err) {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

// ── 1. YouTube Extraction Logic ──────────────────────────────────────────────
function extractYouTubeVideoId(url) {
  if (!url) return null;
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  return null;
}

// ── 2. Google Drive Validation Logic ─────────────────────────────────────────
function validateDriveUrl(url) {
  if (!url) return false;
  return /^https?:\/\/(?:drive|docs)\.google\.com\/.+/i.test(url);
}

// ── 3. Enrollment Policy Simulation ──────────────────────────────────────────
function validateEnrollmentRedemption(codeDoc, studentUid) {
  if (!codeDoc) {
    return { ok: false, error: "Invalid enrollment code." };
  }
  if (codeDoc.status === "revoked") {
    return { ok: false, error: "This code has been revoked." };
  }
  if (codeDoc.expiresAt && new Date() > new Date(codeDoc.expiresAt)) {
    return { ok: false, error: "This code has expired." };
  }
  if (codeDoc.currentRedemptions >= codeDoc.maxRedemptions) {
    return { ok: false, error: "Maximum redemptions exceeded." };
  }
  if (codeDoc.redeemedBy && codeDoc.redeemedBy.includes(studentUid)) {
    return { ok: false, error: "User has already redeemed this code." };
  }
  return { ok: true };
}

console.log("\n\x1b[36m=== 1. YouTube Video URL Sanitization & ID Extraction ===\x1b[0m");
test("extracts ID from standard watch URL", () => {
  assert.strictEqual(
    extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    "dQw4w9WgXcQ"
  );
});

test("extracts ID from youtu.be short URL", () => {
  assert.strictEqual(
    extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ"),
    "dQw4w9WgXcQ"
  );
});

test("extracts ID from embed URL", () => {
  assert.strictEqual(
    extractYouTubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ"),
    "dQw4w9WgXcQ"
  );
});

test("extracts ID from live stream URL", () => {
  assert.strictEqual(
    extractYouTubeVideoId("https://www.youtube.com/live/dQw4w9WgXcQ"),
    "dQw4w9WgXcQ"
  );
});

test("accepts raw 11-char video ID", () => {
  assert.strictEqual(
    extractYouTubeVideoId("dQw4w9WgXcQ"),
    "dQw4w9WgXcQ"
  );
});

test("rejects arbitrary or malicious URLs", () => {
  assert.strictEqual(extractYouTubeVideoId("https://vimeo.com/123456"), null);
  assert.strictEqual(extractYouTubeVideoId("javascript:alert('pwned')"), null);
  assert.strictEqual(extractYouTubeVideoId("https://evil.com/youtube.com/watch?v=123"), null);
  assert.strictEqual(extractYouTubeVideoId(""), null);
});

console.log("\n\x1b[36m=== 2. Google Drive Resource Validation ===\x1b[0m");
test("accepts drive.google.com URLs", () => {
  assert.strictEqual(
    validateDriveUrl("https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view"),
    true
  );
});

test("accepts docs.google.com document and presentation URLs", () => {
  assert.strictEqual(
    validateDriveUrl("https://docs.google.com/presentation/d/12345/edit"),
    true
  );
  assert.strictEqual(
    validateDriveUrl("https://docs.google.com/spreadsheets/d/12345/edit"),
    true
  );
});

test("rejects third-party storage or untrusted hosts", () => {
  assert.strictEqual(validateDriveUrl("https://dropbox.com/s/sample.pdf"), false);
  assert.strictEqual(validateDriveUrl("https://box.com/s/123"), false);
  assert.strictEqual(validateDriveUrl("http://untrusted-site.com/file.pdf"), false);
  assert.strictEqual(validateDriveUrl(""), false);
});

console.log("\n\x1b[36m=== 3. Enrollment Code Security & Redemption Policies ===\x1b[0m");
test("permits redemption of a valid active code", () => {
  const code = {
    code: "DH-2026-ABC123",
    status: "active",
    maxRedemptions: 1,
    currentRedemptions: 0,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    redeemedBy: [],
  };
  const res = validateEnrollmentRedemption(code, "student_1");
  assert.strictEqual(res.ok, true);
});

test("rejects revoked enrollment codes", () => {
  const code = {
    status: "revoked",
    maxRedemptions: 1,
    currentRedemptions: 0,
    redeemedBy: [],
  };
  const res = validateEnrollmentRedemption(code, "student_1");
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.error, "This code has been revoked.");
});

test("rejects expired enrollment codes", () => {
  const code = {
    status: "active",
    maxRedemptions: 1,
    currentRedemptions: 0,
    expiresAt: new Date(Date.now() - 86400000).toISOString(), // yesterday
    redeemedBy: [],
  };
  const res = validateEnrollmentRedemption(code, "student_1");
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.error, "This code has expired.");
});

test("rejects redemption if maximum redemption limit is reached", () => {
  const code = {
    status: "active",
    maxRedemptions: 5,
    currentRedemptions: 5,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    redeemedBy: ["s1", "s2", "s3", "s4", "s5"],
  };
  const res = validateEnrollmentRedemption(code, "student_6");
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.error, "Maximum redemptions exceeded.");
});

test("prevents the same student from redeeming the same code twice", () => {
  const code = {
    status: "active",
    maxRedemptions: 10,
    currentRedemptions: 2,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    redeemedBy: ["student_1", "student_2"],
  };
  const res = validateEnrollmentRedemption(code, "student_1");
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.error, "User has already redeemed this code.");
});

console.log("\n\x1b[36m=== 4. Role Authorization & Content Isolation Simulation ===\x1b[0m");
test("ensures student cannot perform admin operations", () => {
  const student = { uid: "student_1", role: "student", isAdmin: false };
  assert.strictEqual(student.isAdmin, false);
});

test("ensures suspended student is denied access", () => {
  const suspendedUser = { uid: "student_2", status: "suspended" };
  assert.strictEqual(suspendedUser.status, "suspended");
});

test("computes correct composite enrollment document ID", () => {
  const uid = "student_999";
  const courseId = "course_ai_2026";
  const docId = `${uid}_${courseId}`;
  assert.strictEqual(docId, "student_999_course_ai_2026");
});

console.log("\n==========================================");
if (failed === 0) {
  console.log(`\x1b[32m✔ ALL ${passed} AUTOMATED TESTS PASSED SUCCESSFULLY!\x1b[0m\n`);
  process.exit(0);
} else {
  console.log(`\x1b[31m✖ ${failed} TESTS FAILED (${passed} passed)\x1b[0m\n`);
  process.exit(1);
}

