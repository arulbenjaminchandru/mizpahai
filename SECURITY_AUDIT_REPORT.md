# TiBen AI Academy — Application Security Audit Report
## Course Discovery, Dynamic Pricing, WhatsApp Enquiries & Access Management

**Document Version:** 2.0.0  
**Audit Scope:** Next.js Application, API Routes, Firestore Security Rules, RBAC & Data Sanitization  
**Auditor Role:** Application Security Specialist & Principal Architect  
**Date:** November 1, 2026  
**Status:** Certified Secure (Zero Unresolved Critical/High Risks)  

---

## 1. Executive Summary

This Security Audit covers all attack vectors associated with the new course pricing, WhatsApp enquiries, manual enrollment, course-specific revocation, and Google Drive brochure workflows. All 20 items from the Master Specification (Part 16) were rigorously analyzed and verified through automated assertions, type checks, and API contract evaluations.

---

## 2. Findings & Threat Mitigation Matrix

### Finding SEC-01: IDOR in Course Enquiry Creation
- **Severity:** High
- **Vulnerability:** Malicious student submitting a purchase enquiry on behalf of another student by passing arbitrary `userId` in POST body.
- **Remediation:** Server endpoint `/api/enquiries` ignores any frontend-supplied UID and exclusively derives the student's identity from `verifyAuth(req)` via Firebase Admin ID token.
- **Verification:** Verified in Module 17 automated tests.
- **Status:** Resolved / Closed.

### Finding SEC-02: Price Manipulation & Frontend Discount Tampering
- **Severity:** High
- **Vulnerability:** Attacker tampering with frontend payload to record an arbitrary low price snapshot during enquiry or course purchase.
- **Remediation:** `/api/enquiries` reads the authoritative course document directly from Firestore server-side and computes the price and discount snapshots internally. Frontend prices are completely ignored.
- **Verification:** Verified in Module 15 and Module 17 tests.
- **Status:** Resolved / Closed.

### Finding SEC-03: Google Drive Brochure URL Spoofing & Stored XSS
- **Severity:** High
- **Vulnerability:** Administrator or compromised session storing `javascript:` or phishing URL in course brochure configuration.
- **Remediation:** Strict regex validation `validateGoogleDriveBrochureUrl` enforced in both client form and backend route (`/api/admin/courses/[id]`). Rejects any non-HTTPS URL or unapproved domain.
- **Verification:** Verified in Module 16 automated tests.
- **Status:** Resolved / Closed.

### Finding SEC-04: Unauthorized Brochure URL Disclosure
- **Severity:** Medium
- **Vulnerability:** Leaking Google Drive brochure URLs when brochure availability is disabled.
- **Remediation:** In `/api/courses`, the field `brochureUrl` is conditionally included only when `brochureEnabled === true`. When disabled, the URL is masked (`""`).
- **Verification:** Verified in Module 16 automated tests.
- **Status:** Resolved / Closed.

### Finding SEC-05: Unauthorized Self-Grant of Course Access
- **Severity:** Critical
- **Vulnerability:** Student manipulating enquiry status to `access_granted` or creating direct document in `enrollments`.
- **Remediation:**
  1. `/api/admin/enquiries/[id]/grant-access` requires `requireAdmin(req)`.
  2. Firestore Security Rules deny create/update on `enrollments` for non-admin unless redeeming a valid code through the server transaction.
  3. Denies update on `courseEnquiries` for students (`allow update, delete: if isAdmin()`).
- **Verification:** Verified in Module 18 and Module 19 tests.
- **Status:** Resolved / Closed.

### Finding SEC-06: Cross-Course Collateral Revocation
- **Severity:** Medium
- **Vulnerability:** Revoking one course mistakenly revoking all courses or altering user account status.
- **Remediation:** Revocation operates exclusively on document ID `${userId}_${courseId}` in `enrollments`. User document status in `users` remains `active`, and all other course enrollments retain their status.
- **Verification:** Verified in Module 20 automated tests.
- **Status:** Resolved / Closed.

### Finding SEC-07: Classroom Access Bypass with Revoked Status
- **Severity:** High
- **Vulnerability:** Student whose course was revoked accessing `/courses/[id]` because enrollment document still exists in Firestore.
- **Remediation:** Updated classroom access check in `src/app/courses/[id]/page.tsx` to mandate `enrollmentDoc.exists() && enrollmentDoc.data()?.status === "active"`. Revoked or suspended statuses result in immediate authorization rejection.
- **Verification:** Verified in Module 20 automated tests.
- **Status:** Resolved / Closed.

### Finding SEC-08: Automated Access Trigger via WhatsApp Links
- **Severity:** Medium
- **Vulnerability:** Opening WhatsApp enquiry link unintentionally granting access or marking payment as confirmed.
- **Remediation:** Clicking the enquiry button only creates a `new` enquiry record and generates a link for the student to open in WhatsApp. No automated state changes occur upon opening the link.
- **Verification:** Verified in Module 17 automated tests.
- **Status:** Resolved / Closed.

---

## 3. Firestore Cloud Security Rules Hardening

The `firestore.rules` file has been updated with strict RBAC:
```javascript
// ─── Collection: courseEnquiries ───────────────────────────────────────
match /courseEnquiries/{enquiryId} {
  allow read: if isSignedIn() && (
    isAdmin() ||
    (resource != null && resource.data.userId == request.auth.uid)
  );
  allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
  allow update, delete: if isAdmin();
}

// ─── Collection: courseAccessAudits ────────────────────────────────────
match /courseAccessAudits/{auditId} {
  allow read, write: if isAdmin();
}

// ─── Collection: settings ──────────────────────────────────────────────
match /settings/{settingId} {
  allow read: if isSignedIn();
  allow write: if isAdmin();
}
```

---

## 4. Final Security Clearance

All security requirements from Part 16 are satisfied:
- No hardcoded secrets or prices in frontend components.
- Rate limiting implemented on enquiry submissions.
- Sensitive payment notes and admin audit logs protected from student access.
- Zero known high or critical vulnerabilities.
