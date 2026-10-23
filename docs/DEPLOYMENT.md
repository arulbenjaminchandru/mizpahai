# Deployment Guide — Data Horizon Academy

> **Version:** 1.0  
> **Last Updated:** 2026-10-23  
> **Status:** Approved

---

## 1. Prerequisites

Before deploying, ensure you have:

- [ ] Node.js 18+ installed locally
- [ ] A Google account for Firebase project ownership
- [ ] A GitHub account (for Vercel integration)
- [ ] A Vercel account (Hobby plan — free)
- [ ] The project repository pushed to GitHub

---

## 2. Firebase Project Setup

### 2.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Enter project name: `data-horizon-academy` (or your preferred name)
4. Disable Google Analytics (not needed for this project)
5. Click **"Create project"**

### 2.2 Enable Authentication Providers

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Google** provider:
   - Click Google → Enable
   - Set the project support email
   - Click **Save**
3. Enable **Email/Password** provider:
   - Click Email/Password → Enable
   - Leave "Email link (passwordless sign-in)" disabled
   - Click **Save**

### 2.3 Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **"Create database"**
3. Select **Start in production mode** (we'll deploy custom rules)
4. Choose a Firestore location closest to your users (e.g., `us-central1`, `asia-south1`)
   > ⚠️ **This cannot be changed later.** Choose carefully.
5. Click **"Enable"**

### 2.4 Get Firebase Client SDK Configuration

1. In Firebase Console, go to **Project Settings** (gear icon) → **General**
2. Scroll down to **"Your apps"**
3. Click the **Web** icon (`</>`) to add a web app
4. Enter app nickname: `data-horizon-web`
5. Do **not** enable Firebase Hosting
6. Click **"Register app"**
7. Copy the `firebaseConfig` object — you'll need these values:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "data-horizon-academy.firebaseapp.com",
  projectId: "data-horizon-academy",
  storageBucket: "data-horizon-academy.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 2.5 Generate Firebase Admin SDK Service Account Key

1. In Firebase Console, go to **Project Settings** → **Service accounts**
2. Click **"Generate new private key"**
3. Save the JSON file securely (e.g., `service-account-key.json`)
4. **Never commit this file to version control**

From this JSON file, extract:
- `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
- `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
- `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY`

---

## 3. Environment Variables

### 3.1 Local Development (.env.local)

Create a `.env.local` file in the project root:

```bash
# Firebase Client SDK (public — embedded in client bundles)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=data-horizon-academy.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=data-horizon-academy
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=data-horizon-academy.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin SDK (server-only — MUST NOT have NEXT_PUBLIC_ prefix)
FIREBASE_ADMIN_PROJECT_ID=data-horizon-academy
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@data-horizon-academy.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Important:** The `FIREBASE_ADMIN_PRIVATE_KEY` value must be wrapped in double quotes and contain literal `\n` characters (not actual newlines).

### 3.2 Vercel Environment Variables

Set these in Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Environment | Sensitive |
|----------|-------------|-----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | All | No |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | All | No |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | All | No |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | All | No |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | All | No |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | All | No |
| `FIREBASE_ADMIN_PROJECT_ID` | All | Yes |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | All | Yes |
| `FIREBASE_ADMIN_PRIVATE_KEY` | All | Yes |
| `NEXT_PUBLIC_APP_URL` | Production | No |

> **Tip:** For `FIREBASE_ADMIN_PRIVATE_KEY` in Vercel, paste the raw private key value including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` markers, with actual newlines (Vercel handles multi-line values).

---

## 4. Admin Bootstrap

### 4.1 Bootstrap the First Admin User

**Step 1:** Start the application and sign in with the account you want to make an admin. This creates the user's Firebase Auth account and Firestore user document.

**Step 2:** Run the admin bootstrap script locally:

```bash
# Ensure the service account key JSON file is in the project root
# (or adjust the path in the script)

npx ts-node scripts/set-admin.ts admin@datahorizon.com
```

**Step 3:** The user must **sign out and sign back in** for the custom claims to take effect. The new ID token will contain `role: 'admin'`.

**Step 4:** Verify admin access by navigating to `/admin`. If successful, the admin dashboard should load.

### 4.2 Adding Additional Admins

Repeat the same process with a different email:

```bash
npx ts-node scripts/set-admin.ts another-admin@datahorizon.com
```

---

## 5. Firestore Security Rules Deployment

### 5.1 Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 5.2 Initialize Firebase in the Project

```bash
firebase init firestore
```

When prompted:
- Select your Firebase project
- Accept the default `firestore.rules` file location
- Accept the default `firestore.indexes.json` file location

### 5.3 Deploy Security Rules

Ensure `firestore.rules` contains the security rules from [SECURITY.md](./SECURITY.md), then:

```bash
firebase deploy --only firestore:rules
```

### 5.4 Deploy Indexes

Ensure `firestore.indexes.json` contains the composite indexes from [DATA_MODEL.md](./DATA_MODEL.md), then:

```bash
firebase deploy --only firestore:indexes
```

> **Note:** Index building may take a few minutes. Check the Firebase Console → Firestore → Indexes to monitor progress.

---

## 6. Vercel Deployment

### 6.1 Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `next build` (default)
   - **Output Directory:** `.next` (default)
5. Add all environment variables (see Section 3.2)
6. Click **"Deploy"**

### 6.2 Verify Deployment

After deployment completes:

1. Visit the deployment URL (e.g., `https://data-horizon-academy.vercel.app`)
2. Verify the landing page loads
3. Test sign-in with Google
4. Test sign-in with email/password

### 6.3 Configure Firebase Auth Domain

After getting your Vercel deployment URL, update Firebase Auth settings:

1. Go to Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Add your Vercel domain: `data-horizon-academy.vercel.app`
3. If using a custom domain, add that too

### 6.4 Update NEXT_PUBLIC_APP_URL

Update the `NEXT_PUBLIC_APP_URL` environment variable in Vercel to match your production URL:

```
NEXT_PUBLIC_APP_URL=https://data-horizon-academy.vercel.app
```

Then redeploy to apply the change.

---

## 7. Custom Domain (Optional)

### 7.1 Add Custom Domain to Vercel

1. In Vercel Dashboard → Project Settings → **Domains**
2. Enter your domain (e.g., `learn.datahorizon.com`)
3. Follow Vercel's DNS configuration instructions:
   - Add a CNAME record pointing to `cname.vercel-dns.com`
   - Or use Vercel's nameservers for full DNS management

### 7.2 Update Firebase Auth Authorized Domains

1. Firebase Console → Authentication → Settings → Authorized domains
2. Add your custom domain: `learn.datahorizon.com`

### 7.3 Update Environment Variable

Update `NEXT_PUBLIC_APP_URL` in Vercel to the custom domain:

```
NEXT_PUBLIC_APP_URL=https://learn.datahorizon.com
```

---

## 8. Production Smoke Test Checklist

After deploying to production, run through this checklist to verify everything works:

### Authentication

- [ ] Landing page loads correctly
- [ ] Google Sign-In works → redirects to dashboard
- [ ] Email/Password sign-up works → account created
- [ ] Email/Password sign-in works → redirects to dashboard
- [ ] Sign-out works → redirected to landing page
- [ ] Unauthenticated access to `/dashboard` redirects to `/sign-in`
- [ ] Unauthenticated access to `/admin` redirects to `/sign-in`

### Admin Functions

- [ ] Admin user can access `/admin` dashboard
- [ ] Non-admin user is blocked from `/admin`
- [ ] Create a course → appears in course list
- [ ] Edit a course → changes persist
- [ ] Add weeks, modules, lessons to a course
- [ ] YouTube URL is accepted and video ID is extracted
- [ ] Add resources with Google Drive links
- [ ] Publish/unpublish toggles work
- [ ] Generate an enrollment code → code is displayed

### Enrollment

- [ ] Student enters valid enrollment code → enrolled in course
- [ ] Student enters invalid code → error message shown
- [ ] Student enters expired code → error message shown
- [ ] Student enters already-used-up code → error message shown
- [ ] Student tries to enroll in same course twice → error message
- [ ] Admin can revoke an enrollment code → code can no longer be redeemed

### Student Experience

- [ ] Dashboard shows enrolled courses with progress
- [ ] Course page shows published weeks/modules/lessons
- [ ] Unpublished content is **not** visible to students
- [ ] YouTube video embeds load and play
- [ ] Google Drive resource links open in new tab
- [ ] "Mark as Complete" works → progress updates
- [ ] Course progress percentage updates correctly

### Security

- [ ] Firestore security rules are deployed (check Firebase Console)
- [ ] Direct Firestore access to unpublished content is denied
- [ ] Direct Firestore access to other users' progress is denied
- [ ] API routes return 401 without session cookie
- [ ] Admin API routes return 403 for non-admin users

---

## 9. Cost Monitoring

### 9.1 Firebase Usage Monitoring

Monitor usage in Firebase Console → **Usage and billing**:

| Resource | Free Tier Limit | Warning Threshold |
|----------|----------------|-------------------|
| Firestore Reads | 50,000/day | 40,000/day |
| Firestore Writes | 20,000/day | 15,000/day |
| Firestore Deletes | 20,000/day | 15,000/day |
| Firestore Storage | 1 GiB | 800 MiB |

### 9.2 Vercel Usage Monitoring

Monitor usage in Vercel Dashboard → **Usage**:

| Resource | Free Tier Limit | Warning Threshold |
|----------|----------------|-------------------|
| Bandwidth | 100 GB/month | 80 GB/month |
| Serverless Execution | 100 GB-hours/month | 80 GB-hours/month |
| Edge Invocations | 500K/month | 400K/month |

### 9.3 Cost Optimization Tips

| Strategy | Impact |
|----------|--------|
| Use efficient Firestore queries (avoid fetching unnecessary documents) | Reduces reads |
| Implement client-side caching for course content (content changes infrequently) | Reduces reads |
| Use `select()` to fetch only needed fields | Reduces bandwidth |
| Batch related reads where possible | Reduces round trips |
| Use `limitToFirst()` / `limitToLast()` for paginated admin lists | Reduces reads |
| Serve videos from YouTube and files from Google Drive (not through the app) | Reduces bandwidth |
| Use Next.js static generation for public pages | Reduces serverless invocations |

### 9.4 Firebase Budget Alert Setup

1. Go to Firebase Console → **Usage and billing** → **Details & settings**
2. Note: On the Spark (free) plan, you cannot be charged — the service simply stops when limits are reached
3. Monitor the usage dashboard periodically to ensure you're well within limits

---

## 10. Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Google Sign-In fails | Domain not authorized in Firebase | Add domain to Firebase Auth → Authorized domains |
| Admin routes return 403 | Custom claims not set or not refreshed | Re-run bootstrap script; user must sign out and sign in again |
| `FIREBASE_ADMIN_PRIVATE_KEY` errors | Newline encoding issues | Ensure the key is wrapped in double quotes with `\n` (local) or pasted with real newlines (Vercel) |
| Firestore permission denied | Security rules not deployed | Run `firebase deploy --only firestore:rules` |
| Composite index errors in console | Missing Firestore indexes | Run `firebase deploy --only firestore:indexes` or click the link in the error message |
| Session cookie not set | `secure: true` on HTTP (local dev) | Use `secure: process.env.NODE_ENV === 'production'` |
| Vercel serverless timeout | Long Firestore operations | Optimize queries; check for missing indexes |
| Build fails on Vercel | Missing environment variables | Verify all env vars are set in Vercel Dashboard |

### Debugging Steps

1. **Check Vercel Function Logs:** Vercel Dashboard → Project → **Logs** → Filter by function
2. **Check Firestore Rules:** Firebase Console → Firestore → **Rules playground** (test rules without deploying)
3. **Check Auth State:** Browser DevTools → Application → Cookies → Verify `session` cookie exists
4. **Check Token Claims:** Firebase Console → Authentication → Users → Click user → Check custom claims
5. **Check Indexes:** Firebase Console → Firestore → **Indexes** → Verify all indexes have status "Enabled"

---

## 11. Deployment Checklist Summary

```
Pre-Deployment:
  ✅ Firebase project created
  ✅ Auth providers enabled (Google + Email/Password)
  ✅ Firestore database created
  ✅ Service account key generated
  ✅ Environment variables configured (.env.local)
  ✅ Firestore security rules written
  ✅ Firestore indexes defined

Deployment:
  ✅ Repository pushed to GitHub
  ✅ Vercel project created and connected to repo
  ✅ All environment variables set in Vercel
  ✅ First deployment successful
  ✅ Firebase Auth authorized domains updated
  ✅ NEXT_PUBLIC_APP_URL updated to production URL

Post-Deployment:
  ✅ Firestore security rules deployed (firebase deploy --only firestore:rules)
  ✅ Firestore indexes deployed (firebase deploy --only firestore:indexes)
  ✅ Admin user bootstrapped (npx ts-node scripts/set-admin.ts)
  ✅ Smoke tests passed
  ✅ Custom domain configured (if applicable)
```
