# Product Requirements Document — Data Horizon Academy

> **Version:** 1.0  
> **Last Updated:** 2026-10-23  
> **Status:** Approved

---

## 1. Product Vision

**Data Horizon Academy** is a private, invite-only Learning Management System (LMS) built for the Data Horizon training program. It delivers structured courses in **Data Engineering, Python, Cloud Computing, and Generative AI** to enrolled cohorts of students.

The platform is designed to be:

- **Private** — Only students with valid enrollment codes can access course content.
- **Structured** — Content is organized into courses → weeks → modules → lessons.
- **Video-first** — Lessons are delivered through embedded YouTube videos.
- **Resource-rich** — Supplementary materials are distributed via Google Drive links.
- **Cost-efficient** — Built entirely on free-tier infrastructure (Firebase Spark + Vercel Hobby).

### 1.1 Goals

| Goal | Description |
|------|-------------|
| **Controlled Access** | Only authorized students can view course content |
| **Organized Delivery** | Content is structured by week, module, and lesson |
| **Progress Tracking** | Students can mark lessons complete and track their progress |
| **Admin Autonomy** | Administrators can manage all content without developer intervention |
| **Zero Cost** | Operates within Firebase Spark and Vercel Hobby free tiers |

### 1.2 Non-Goals

- Public course marketplace or open enrollment
- Payment processing or e-commerce
- Live streaming or real-time video conferencing
- Discussion forums or student-to-student communication
- Certificate generation or automated grading
- Mobile native applications (responsive web only)
- Self-hosted video storage (YouTube is the video platform)

---

## 2. User Roles

### 2.1 Administrator

Administrators have full control over the platform's content and user management.

| Permission | Description |
|-----------|-------------|
| **Manage Courses** | Create, edit, publish/unpublish, and delete courses |
| **Manage Content** | Create and organize weeks, modules, lessons, and resources within courses |
| **Manage Enrollment Codes** | Generate, view, and revoke enrollment codes for courses |
| **View Enrollments** | See which students are enrolled in which courses |
| **Manage Users** | View user list; suspend or reactivate student accounts |
| **Access Admin Dashboard** | Access the `/admin` route group and all admin UI |

**Bootstrap Process:** The first administrator is bootstrapped via a CLI script that sets Firebase Auth custom claims (`role: 'admin'`) on a user account identified by email. Subsequent admins can be promoted the same way.

### 2.2 Student

Students access the platform after redeeming a valid enrollment code.

| Permission | Description |
|-----------|-------------|
| **Redeem Enrollment Code** | Enter a valid code to enroll in a course |
| **View Enrolled Courses** | See courses they are enrolled in on their dashboard |
| **View Published Content** | Access published weeks, modules, and lessons for enrolled courses only |
| **Watch Lesson Videos** | View embedded YouTube videos for published lessons |
| **Download Resources** | Access Google Drive links for course materials |
| **Track Progress** | Mark lessons as complete; view completion percentage per course |
| **Manage Profile** | View their profile information (sourced from Firebase Auth) |

### 2.3 Unauthenticated User

| Permission | Description |
|-----------|-------------|
| **View Landing Page** | See the public landing page |
| **Sign Up / Sign In** | Create an account or sign in via Google or email/password |

---

## 3. Core Features

### 3.1 Authentication

| Feature | Details |
|---------|---------|
| **Google Sign-In** | One-click sign-in via Google OAuth (Firebase Auth provider) |
| **Email/Password** | Traditional sign-up and sign-in with email and password |
| **Session Persistence** | Firebase Auth session persisted in the browser |
| **Role-Based Access** | Custom claims on Firebase Auth tokens distinguish admin from student |
| **Protected Routes** | Next.js middleware redirects unauthenticated users to sign-in |

### 3.2 Enrollment System

| Feature | Details |
|---------|---------|
| **Code Generation** | Admins generate enrollment codes tied to a specific course and batch |
| **Code Properties** | Each code has: max redemptions, expiration date, batch name |
| **Code Redemption** | Students enter a code on their dashboard to enroll in a course |
| **Server-Side Validation** | Codes are validated and redeemed via a Vercel API route (not client-side) |
| **Hashed Storage** | Codes are stored as hashed values in Firestore; only a 4-char prefix is kept for admin display |
| **Atomic Redemption** | Firestore transactions ensure redemption count is incremented atomically |
| **Code Revocation** | Admins can revoke codes to prevent further redemptions |

### 3.3 Course Management (Admin)

| Feature | Details |
|---------|---------|
| **Course CRUD** | Create, read, update, delete courses |
| **Course Fields** | Name, slug, description, cover image URL, instructor name, batch, dates, publish status |
| **Week Management** | Add/edit/delete/reorder weeks within a course |
| **Module Management** | Add/edit/delete/reorder modules within a week |
| **Lesson Management** | Add/edit/delete/reorder lessons within a module |
| **Resource Management** | Add/edit/delete resources linked to courses, weeks, or individual lessons |
| **Publish Controls** | Each content level (course, week, module, lesson) has an independent publish toggle |
| **YouTube Integration** | Lessons reference YouTube videos by video ID; admin enters a YouTube URL and the system extracts the video ID |
| **Google Drive Links** | Resources link to Google Drive files/folders via URL |

### 3.4 Student Dashboard

| Feature | Details |
|---------|---------|
| **Enrolled Courses** | Grid/list of courses the student is enrolled in |
| **Course Progress** | Visual progress indicator (percentage of lessons completed) |
| **Enroll Action** | Form to enter and redeem an enrollment code |

### 3.5 Course Viewer (Student)

| Feature | Details |
|---------|---------|
| **Course Overview** | Course description, instructor, batch info |
| **Week Navigation** | Sidebar or accordion listing weeks and their modules/lessons |
| **Lesson View** | Embedded YouTube player with lesson title and description |
| **Resource Access** | List of Google Drive links for the current context (course, week, or lesson) |
| **Progress Tracking** | "Mark as Complete" button on each lesson; visual indicators for completed lessons |

### 3.6 Video Delivery

| Feature | Details |
|---------|---------|
| **Platform** | YouTube (embedded via iframe) |
| **Video Privacy** | Videos should be set to **Unlisted** on YouTube |
| **Embed Method** | Standard YouTube iframe embed using the video ID |
| **URL Parsing** | System accepts various YouTube URL formats and extracts the video ID |

### 3.7 Resource Distribution

| Feature | Details |
|---------|---------|
| **Platform** | Google Drive |
| **Link Types** | Direct links to files or folders on Google Drive |
| **File Types** | Categorized by type (PDF, Notebook, Slide, Dataset, Code, Other) |
| **Access Control** | Google Drive permissions are managed externally (not by this system) |
| **Categories** | Resources are categorized (e.g., Reading Material, Assignment, Reference, Tool) |

---

## 4. Non-Functional Requirements

### 4.1 Security

| Requirement | Details |
|-------------|---------|
| **Authentication** | All non-public routes require Firebase Auth authentication |
| **Authorization** | Admin routes verify `admin` custom claim on ID token server-side |
| **Enrollment Check** | Student content access verifies active enrollment in the course |
| **Input Validation** | All user input validated with Zod schemas on both client and server |
| **URL Sanitization** | YouTube URLs restricted to `youtube.com` and `youtu.be` domains |
| **Hashed Secrets** | Enrollment codes stored as SHA-256 hashes |
| **CSRF Protection** | State-changing API routes validate origin headers |

### 4.2 Performance

| Requirement | Target |
|-------------|--------|
| **Initial Page Load** | < 3 seconds on broadband |
| **Navigation** | Near-instant via Next.js client-side routing |
| **API Response** | < 500ms for standard operations |
| **Firestore Reads** | Minimized through efficient queries and caching |

### 4.3 Accessibility

| Requirement | Details |
|-------------|---------|
| **Standard** | WCAG 2.1 Level AA as a baseline target |
| **Keyboard Navigation** | All interactive elements keyboard-accessible |
| **Screen Readers** | Semantic HTML, ARIA labels where needed |
| **Color Contrast** | Meets AA contrast ratios (shadcn/ui defaults are compliant) |
| **Responsive Design** | Functional on mobile, tablet, and desktop viewports |

### 4.4 Browser Support

| Browser | Version |
|---------|---------|
| Chrome | Latest 2 versions |
| Firefox | Latest 2 versions |
| Safari | Latest 2 versions |
| Edge | Latest 2 versions |

### 4.5 Free-Tier Constraints

#### Firebase Spark Plan

| Resource | Limit | Impact |
|----------|-------|--------|
| Firestore Storage | 1 GiB | Sufficient for metadata-only storage (no file uploads) |
| Firestore Reads | 50,000/day | Must minimize reads; use efficient queries |
| Firestore Writes | 20,000/day | Adequate for admin content management and student progress |
| Firestore Deletes | 20,000/day | Adequate for content management |
| Auth Users | Unlimited | No constraint on user registration |
| Cloud Functions | **Not available** | Use Vercel API routes instead |

#### Vercel Hobby Plan

| Resource | Limit | Impact |
|----------|-------|--------|
| Serverless Functions | 100 GB-hours/month | Sufficient for API routes |
| Edge Functions | 500K invocations/month | Available for middleware |
| Bandwidth | 100 GB/month | Sufficient for SSR pages (video served from YouTube) |
| Build Time | 100 hours/month | More than sufficient |

---

## 5. Limitations and Assumptions

### 5.1 YouTube Video Privacy

- Videos set to **Unlisted** on YouTube are accessible to anyone with the direct link or embed URL.
- Unlisted ≠ Private: If a student shares the YouTube URL, others can view it outside the platform.
- This is an accepted trade-off. True video protection would require a paid video hosting service.
- **Mitigation:** Unlisted URLs are not easily discoverable, and the target audience is a private training cohort.

### 5.2 Google Drive Permissions

- Google Drive file/folder permissions are managed **entirely outside** this system.
- Administrators must manually configure Google Drive sharing settings (e.g., "Anyone with the link" or specific email sharing).
- The LMS stores and displays Drive links but has no control over whether a student can actually access the file.
- **Recommendation:** Use "Anyone with the link" for simplicity, or share with specific emails for tighter control.

### 5.3 No Real-Time Features

- The platform does not provide real-time collaboration, live chat, or live notifications.
- Firestore real-time listeners may be used selectively for UI updates but are not a core feature.

### 5.4 Single Tenant

- The platform serves a single organization (Data Horizon).
- There is no multi-tenancy or organization management.

### 5.5 No File Uploads

- The platform does not accept file uploads from students or admins.
- All media (videos, documents) is hosted on external platforms (YouTube, Google Drive).
- Cover images for courses are referenced by external URL.

---

## 6. User Flows

### 6.1 Student Registration and Enrollment

```
1. Student visits the landing page
2. Student clicks "Sign In" and authenticates via Google or email/password
3. New user record is created in Firestore with role: 'student'
4. Student is redirected to their dashboard
5. Student enters an enrollment code in the enrollment form
6. System validates the code server-side (exists, not expired, not revoked, under max redemptions)
7. On success: enrollment record created, student can access the course
8. On failure: appropriate error message displayed
```

### 6.2 Student Learning

```
1. Student signs in and views their dashboard
2. Student clicks on an enrolled course
3. Course page shows weeks → modules → lessons hierarchy
4. Student selects a lesson
5. YouTube video is embedded and plays inline
6. Student accesses related resources (Google Drive links)
7. Student clicks "Mark as Complete" when finished
8. Progress bar updates on the course page
```

### 6.3 Admin Content Management

```
1. Admin signs in (custom claim 'admin' on their token)
2. Admin is directed to the admin dashboard
3. Admin creates a new course with metadata
4. Admin adds weeks to the course
5. Admin adds modules to each week
6. Admin adds lessons (with YouTube URLs) to each module
7. Admin adds resources (with Google Drive links) at course, week, or lesson level
8. Admin publishes content by toggling publish flags
9. Admin generates enrollment codes for the course
10. Admin distributes codes to students (outside the platform)
```

---

## 7. Content Hierarchy

```
Course
├── Week 1
│   ├── Module 1.1
│   │   ├── Lesson 1.1.1 (YouTube video)
│   │   ├── Lesson 1.1.2 (YouTube video)
│   │   └── Resource (Google Drive link)
│   ├── Module 1.2
│   │   ├── Lesson 1.2.1 (YouTube video)
│   │   └── Lesson 1.2.2 (YouTube video)
│   └── Resource (Google Drive link — week-level)
├── Week 2
│   └── ...
└── Resource (Google Drive link — course-level)
```

---

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| Platform uptime | 99%+ (dependent on Firebase/Vercel SLAs) |
| Content delivery | All enrolled students can access all published content |
| Admin self-service | Admins can manage all content without developer assistance |
| Free-tier compliance | Platform operates within Firebase Spark and Vercel Hobby limits |
| Page load performance | Core Web Vitals within "Good" range |
