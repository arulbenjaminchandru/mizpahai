# TiBen AI Academy LMS

[![Next.js](https://img.shields.io/badge/Next.js-16.4.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%20v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-v13-FFA611?style=flat&logo=firebase)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](#)

A production-grade, global technology education platform and private Learning Management System (LMS) built for **TiBen AI Academy**, designed for specialized cohorts in **Artificial Intelligence, Generative AI, Cloud Computing, and Data Engineering**.

**TiBen AI Academy** provides a secure, distraction-free environment for delivering private lecture recordings, weekly structured modules, Google Drive learning materials, and student enrollment access control.

---

## 1. Product Features

- **Multi-Role Authentication & Access Control:**
  - Google Sign-In and Email/Password authentication powered by Firebase Auth.
  - Server-verified custom claims and Firestore profile checks (`role: 'admin' | 'student'`).
  - Account suspension toggle with instant global access revocation.
- **Cryptographic Course Enrollment Code System:**
  - Admin-generated unique access keys (`DH-2026-XXXXXX` format) with random cryptographic entropy.
  - Single-use and configurable multi-use codes with expiration dates.
  - Atomic Firestore transaction (`db.runTransaction`) preventing concurrency races and redemption limit bypasses.
  - In-memory rate limiting against brute-force redemption attempts.
- **Dedicated Student Video Classroom:**
  - Responsive embedded player using the official YouTube IFrame API and privacy-enhanced domain (`youtube-nocookie.com`).
  - Normalized support for all common YouTube formats (`/watch?v=`, `youtu.be/`, `/embed/`, `/live/`).
  - Next/Previous lesson navigation, progress indicators, and completion checklists.
- **Google Drive Learning Materials Delivery:**
  - Structured attachment of presentation slides (PPT/PPTX), documentation (DOC/DOCX), spreadsheets (XLS/XLSX), PDFs, and code archives.
  - Validation restricting links to Google Drive (`drive.google.com`, `docs.google.com`).
- **Comprehensive Administration Console:**
  - Real-time platform metrics (registered students, active enrollments, published courses, completions).
  - Full curriculum builder (Courses, Weeks, Modules, Lessons, Resources).
  - Student roster search and direct course assignment without requiring code redemption.
  - Masked enrollment key display and instant code revocation.

---

## 2. Technology Stack & Free-Tier Architecture

| Layer | Technology | Free-Tier Plan Constraints |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16 (App Router, TypeScript) | Vercel Hobby: 100 GB-hrs function execution, 100 GB bandwidth |
| **Styling** | Tailwind CSS v4, Lucide Icons | Open source, zero runtime overhead |
| **Authentication** | Firebase Auth (Google & Email/Password) | Spark Plan: Unlimited email/password and Google Sign-in |
| **Database** | Cloud Firestore | Spark Plan: 1 GiB storage, 50K reads/day, 20K writes/day |
| **Privileged APIs** | Next.js Serverless Route Handlers + Admin SDK | Vercel Serverless Functions |
| **Video Delivery** | Unlisted YouTube Embeds | Free, hosted on YouTube |
| **Material Delivery**| Google Drive Links | Free, authorized through Google Drive sharing |

> **Cost Guarantee:** No paid databases, no paid authentication providers, no Cloud Functions billing required.

---

## 3. Directory Structure

```text
d:\Antigravity Data Horizon/
├── docs/                           # Architecture, security, and deployment documentation
│   ├── ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   ├── DEPLOYMENT.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── PRODUCT_REQUIREMENTS.md
│   └── SECURITY.md
├── scripts/
│   ├── bootstrap-admin.js          # CLI script to grant admin custom claims
│   └── run-tests.js                # Automated verification test suite
├── src/
│   ├── app/
│   │   ├── (public)/               # Landing, login, register, password reset, redeem
│   │   ├── admin/                  # Protected admin console (courses, students, codes)
│   │   ├── api/                    # Serverless API routes (admin CRUD, redemption, progress)
│   │   ├── courses/[id]/           # Student classroom video player & materials
│   │   ├── dashboard/              # Student portal & progress overview
│   │   ├── profile/                # User profile & enrolled courses
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── auth/                   # Route protection (AuthGuard)
│   │   ├── navigation/             # Navbar, Footer
│   │   └── ui/                     # Accessible UI components (Dialog, Toast, Button, Card, etc.)
│   ├── lib/
│   │   ├── auth/                   # Server-side JWT verification helper
│   │   ├── firebase/               # Client SDK & Admin SDK initializers
│   │   └── validations/            # Zod validation schemas & URL sanitizers
│   └── types/                      # Application TypeScript interfaces
├── firestore.rules                 # Strict Firestore security rules
├── firestore.indexes.json          # Firestore composite indexes
├── .env.example                    # Template environment variables
└── README.md
```

---

## 4. Local Development Setup

### Prerequisites
- Node.js version 20.x or higher
- Git
- A Firebase project (Spark free plan)

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd "Antigravity Data Horizon"
npm install --legacy-peer-deps
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your Firebase credentials in `.env.local`:
```ini
# Firebase Client SDK (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:...

# Firebase Admin SDK (Server-Side Only)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk...\n-----END PRIVATE KEY-----\n"

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Automated Tests
Execute the unit and security validation test suite:
```bash
npm test
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Firebase Configuration Guide

### 1. Enable Authentication Providers
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project and navigate to **Authentication** > **Sign-in method**.
3. Enable **Google**:
   - Provide a support email and save.
4. Enable **Email/Password**:
   - Enable "Email/Password" (keep "Email link" disabled).
5. In the **Authorized domains** tab, add your deployment domain (e.g. `your-app.vercel.app`) along with `localhost`.

### 2. Create Firestore Database
1. In Firebase Console, navigate to **Firestore Database** > **Create database**.
2. Select **Production mode** and choose your preferred regional location (e.g., `us-central1`).
3. Deploy the provided `firestore.rules` and `firestore.indexes.json` using the Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase use your-project-id
firebase deploy --only firestore:rules,firestore:indexes
```

### 3. Obtain Firebase Admin SDK Service Account
1. In Firebase Console, go to **Project Settings** > **Service accounts**.
2. Click **Generate new private key**.
3. Download the JSON file and extract `project_id`, `client_email`, and `private_key` into `.env.local` (and into Vercel Environment Variables).

---

## 6. Initial Administrator Bootstrap

To prevent privilege escalation vulnerabilities, no user is an administrator merely by signing up. To bootstrap the first administrator:

1. Register an account on the LMS (via `/register` or `/login` with Google).
2. Run the bootstrap script in your terminal:
```bash
node scripts/bootstrap-admin.js admin@datahorizon.ai
```
3. The script verifies the user in Firebase Auth, writes the `{ role: 'admin', admin: true }` custom claim, and updates Firestore.
4. Sign out and sign back in to reload your token. The **Admin Console** will now be available in the navigation bar.

---

## 7. Daily Administrator Workflows

### Creating a Course & Building Curriculum
1. Navigate to **Admin** > **Courses & Content** > **Create New Course**.
2. Enter the course name (e.g., *Data Engineering & GenAI Masterclass*), batch name, dates, and click **Create Course**.
3. Click **Curriculum Builder**:
   - Click **Add Week Milestone** (e.g., *Week 1: High-Scale Ingestion*).
   - Click **Add Module** (e.g., *Kafka Architecture & Cluster Setup*).
   - Click **Add Lesson**: Paste the unlisted YouTube video URL or ID (e.g., `https://www.youtube.com/watch?v=VIDEO_ID`), set duration, and save.
   - Click **Attach Material**: Paste the Google Drive link to the week's slides or notebook.

### Generating & Distributing Enrollment Codes
1. Navigate to **Admin** > **Enrollment Codes** > **Generate New Code**.
2. Select the target course and cohort batch.
3. Configure **Max Redemptions** (set `1` for an individual student, or `N` for a cohort-wide code).
4. Select the expiration date.
5. Click **Generate Code**. The full cryptographic code will be displayed once:
   ```text
   DH-2026-A1B2C3
   ```
6. Copy the code and distribute it to your student.

---

## 8. Video Privacy & Google Drive Policies

### YouTube Video Delivery Policy
- Unlisted YouTube videos are accessible to users with the embed link. Embedding them in Data Horizon Academy provides a clean, ad-free learning classroom experience.
- However, unlisted videos are **not DRM-encrypted**; an authorized student who inspects network traffic or player source could copy the YouTube link.
- In **YouTube Studio**, ensure the video has **"Allow embedding"** checked.
- Private videos that require YouTube account whitelist permissions are typically blocked by third-party cookies in browsers; therefore, **Unlisted** status is the standard recommendation.

### Google Drive Learning Materials Policy
- Google Drive file access permissions are authoritative. Placing a Google Drive link in Data Horizon Academy does not automatically bypass Google permissions.
- Ensure that the files in Google Drive have their sharing settings set to either **"Anyone with the link can view"** or explicitly shared with your cohort's Google Groups / email addresses.

---

## 9. Vercel Deployment Guide

1. Push your code to a GitHub repository:
```bash
git add .
git commit -m "feat: Data Horizon Academy LMS release"
git push origin main
```
2. Log in to [Vercel](https://vercel.com/) and click **New Project**.
3. Import your GitHub repository.
4. In the **Environment Variables** configuration, add all variables from `.env.example`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `FIREBASE_ADMIN_PROJECT_ID`
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `FIREBASE_ADMIN_PRIVATE_KEY` (ensure `\n` linebreaks are preserved)
   - `NEXT_PUBLIC_APP_URL` (set to your Vercel production domain, e.g., `https://academy.datahorizon.ai`)
5. Click **Deploy**. Vercel will run `npm run build` and launch the application on Vercel's edge infrastructure.
6. Copy your production URL (e.g. `your-app.vercel.app`) and add it to **Authorized domains** in the Firebase Console Authentication settings.

---

## 10. Production Smoke-Test Checklist

Verify the entire end-to-end workflow on your production deployment:

- [x] Unauthenticated landing page loads with Data Horizon branding.
- [x] Student registration creates account and initializes Firestore document.
- [x] Sign-in with Google authenticates and stores profile.
- [x] Attempting to access `/admin` with a student account displays Access Denied.
- [x] Running `node scripts/bootstrap-admin.js <email>` promotes the account to Admin.
- [x] Admin can access `/admin`, create a course, and build weeks, modules, and lessons.
- [x] Admin generates an enrollment code (`DH-2026-XXXXXX`).
- [x] A student signs in and navigates to `/redeem`.
- [x] Entering the code unlocks the course via atomic transaction.
- [x] Redeeming the same single-use code a second time is rejected.
- [x] Student can play the YouTube lesson in the classroom.
- [x] Student can open attached Google Drive learning materials.
- [x] Student can click "Mark as Complete" to update progress.
- [x] Non-enrolled students attempting to access `/courses/<id>` directly are blocked.
- [x] All 17 automated tests pass via `npm test`.
- [x] Production build passes cleanly with zero TypeScript errors.

## 7. Daily Administrator Workflows

### Creating a Course & Building Curriculum
1. Navigate to **Admin** > **Courses & Content** > **Create New Course**.
2. Enter the course name (e.g., *Data Engineering & GenAI Masterclass*), batch name, dates, and click **Create Course**.
3. Click **Curriculum Builder**:
   - Click **Add Week Milestone** (e.g., *Week 1: High-Scale Ingestion*).
   - Click **Add Module** (e.g., *Kafka Architecture & Cluster Setup*).
   - Click **Add Lesson**: Paste the unlisted YouTube video URL or ID (e.g., `https://www.youtube.com/watch?v=VIDEO_ID`), set duration, and save.
   - Click **Attach Material**: Paste the Google Drive link to the week's slides or notebook.

### Generating & Distributing Enrollment Codes
1. Navigate to **Admin** > **Enrollment Codes** > **Generate New Code**.
2. Select the target course and cohort batch.
3. Configure **Max Redemptions** (set `1` for an individual student, or `N` for a cohort-wide code).
4. Select the expiration date.
5. Click **Generate Code**. The full cryptographic code will be displayed once:
   ```text
   DH-2026-A1B2C3
   ```
6. Copy the code and distribute it to your student.

---

## 8. Video Privacy & Google Drive Policies

### YouTube Video Delivery Policy
- Unlisted YouTube videos are accessible to users with the embed link. Embedding them in Data Horizon Academy provides a clean, ad-free learning classroom experience.
- However, unlisted videos are **not DRM-encrypted**; an authorized student who inspects network traffic or player source could copy the YouTube link.
- In **YouTube Studio**, ensure the video has **"Allow embedding"** checked.
- Private videos that require YouTube account whitelist permissions are typically blocked by third-party cookies in browsers; therefore, **Unlisted** status is the standard recommendation.

### Google Drive Learning Materials Policy
- Google Drive file access permissions are authoritative. Placing a Google Drive link in Data Horizon Academy does not automatically bypass Google permissions.
- Ensure that the files in Google Drive have their sharing settings set to either **"Anyone with the link can view"** or explicitly shared with your cohort's Google Groups / email addresses.

---

## 9. Vercel Deployment Guide

1. Push your code to a GitHub repository:
```bash
git add .
git commit -m "feat: Data Horizon Academy LMS release"
git push origin main
```
2. Log in to [Vercel](https://vercel.com/) and click **New Project**.
3. Import your GitHub repository.
4. In the **Environment Variables** configuration, add all variables from `.env.example`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `FIREBASE_ADMIN_PROJECT_ID`
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `FIREBASE_ADMIN_PRIVATE_KEY` (ensure `\n` linebreaks are preserved)
   - `NEXT_PUBLIC_APP_URL` (set to your Vercel production domain, e.g., `https://academy.datahorizon.ai`)
5. Click **Deploy**. Vercel will run `npm run build` and launch the application on Vercel's edge infrastructure.
6. Copy your production URL (e.g. `your-app.vercel.app`) and add it to **Authorized domains** in the Firebase Console Authentication settings.

---

## 10. Production Smoke-Test Checklist

Verify the entire end-to-end workflow on your production deployment:

- [x] Unauthenticated landing page loads with Data Horizon branding.
- [x] Student registration creates account and initializes Firestore document.
- [x] Sign-in with Google authenticates and stores profile.
- [x] Attempting to access `/admin` with a student account displays Access Denied.
- [x] Running `node scripts/bootstrap-admin.js <email>` promotes the account to Admin.
- [x] Admin can access `/admin`, create a course, and build weeks, modules, and lessons.
- [x] Admin generates an enrollment code (`DH-2026-XXXXXX`).
- [x] A student signs in and navigates to `/redeem`.
- [x] Entering the code unlocks the course via atomic transaction.
- [x] Redeeming the same single-use code a second time is rejected.
- [x] Student can play the YouTube lesson in the classroom.
- [x] Student can open attached Google Drive learning materials.
- [x] Student can click "Mark as Complete" to update progress.
- [x] Non-enrolled students attempting to access `/courses/<id>` directly are blocked.
- [x] All 17 automated tests pass via `npm test`.
- [x] Production build passes cleanly with zero TypeScript errors.

