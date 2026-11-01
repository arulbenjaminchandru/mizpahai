# TiBen AI Academy — Production Deployment & Rollout Checklist

**Target Version:** 2.0.0  
**Target Environment:** Vercel + Google Cloud Firestore  
**Branch:** `feature/course-marketplace-manual-enrollment`  
**Deployment Policy:** **STRICTLY PROHIBITED WITHOUT EXPLICIT OWNER APPROVAL**  

---

## 1. Pre-Deployment Readiness Gates

Before requesting owner approval for production deployment, verify all gates:

- [x] **Local Git Branch**: Checked out on `feature/course-marketplace-manual-enrollment`.
- [x] **Zero Regression**: 132 / 132 tests passing across all 20 test modules.
- [x] **Clean Production Build**: `npm run build` generates 33 routes with 0 errors.
- [x] **TypeScript Compliance**: Strict type-checking passed with zero warnings.
- [x] **Firestore Rules Hardened**: Security rules updated for `courseEnquiries`, `courseAccessAudits`, and `settings`.
- [x] **Uncommitted Changes Cleaned**: Working tree prepared for review.

---

## 2. Production Database & Configuration Steps

### 2.1 Database Collections Setup
Ensure the following Firestore collections are initialized in production:
1. `courseEnquiries`: For storing course lead snapshots.
2. `courseAccessAudits`: For recording manual grants and revocations.
3. `settings`: Document `contact` with `whatsappNumber: "+919894481283"`.

### 2.2 Google Drive Brochure Sharing Requirements
For any course brochure Google Drive link:
1. File must be hosted in Google Drive or Google Docs.
2. Sharing setting must be set to: **"Anyone with the link can view"**.
3. Link must start with `https://drive.google.com/` or `https://docs.google.com/`.

### 2.3 Environment Variables Verification
Ensure the following variables are present in Vercel production environment:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

---

## 3. Deployment Sequence (Upon Written Owner Approval Only)

1. **Merge to Main**:
   ```bash
   git checkout main
   git merge feature/course-marketplace-manual-enrollment
   ```
2. **Deploy Security Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```
3. **Trigger Production Build**:
   ```bash
   git push origin main
   ```
4. **Post-Deployment Smoke Tests**:
   - Log in as test student.
   - Verify "Explore Available Courses" loads cards with dynamic prices and discount badges.
   - Click "Get This Course" and verify WhatsApp dialog opens with pre-filled message.
   - Log in as admin and verify enquiry appears in `/admin/enquiries`.
   - Confirm payment and grant course access.
   - Verify student dashboard reflects "You Already Have Access to This Course".
   - Test course revocation on `/admin/students` and verify immediate classroom denial.

---

## 4. Rollback Plan

In the event of an unexpected issue during production rollout:
1. Revert to previous commit on `main`:
   ```bash
   git revert HEAD
   git push origin main
   ```
2. Vercel will automatically redeploy the previous stable build within 90 seconds.
3. Firestore data remains backward compatible; existing `enrollments` collection structure is preserved.
