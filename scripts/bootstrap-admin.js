/**
 * TiBen AI Academy - Administrator Bootstrap Script
 *
 * Promotes a user to the Administrator role by:
 * 1. Looking up user by email in Firebase Auth
 * 2. Setting the custom claim { role: 'admin', admin: true }
 * 3. Updating the Firestore user document to role: 'admin'
 *
 * Usage:
 *   node scripts/bootstrap-admin.js <user-email>
 *
 * Prerequisites:
 *   Ensure FIREBASE_ADMIN_* environment variables are set in .env.local
 *   or run with service account JSON file.
 */

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");

// Load .env.local manually if dotenv is not installed
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

async function bootstrapAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error("\x1b[31mError: Please provide the target user email address.\x1b[0m");
    console.log("Usage: node scripts/bootstrap-admin.js <admin-email@example.com>");
    process.exit(1);
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("\x1b[31mError: Missing Firebase Admin SDK credentials in .env.local\x1b[0m");
    console.log("Required variables: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY");
    process.exit(1);
  }

  privateKey = privateKey.replace(/\\n/g, "\n");

  const app = getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      })
    : getApps()[0];

  const auth = getAuth(app);
  const db = getFirestore(app);

  try {
    console.log(`\n\x1b[36m[TiBen AI Academy]\x1b[0m Looking up user: ${email}...`);
    const userRecord = await auth.getUserByEmail(email);

    console.log(`User found! UID: ${userRecord.uid}`);
    console.log("Setting custom claims: { role: 'admin', admin: true }...");
    await auth.setCustomUserClaims(userRecord.uid, {
      role: "admin",
      admin: true,
    });

    console.log("Updating Firestore profile document...");
    await db.collection("users").doc(userRecord.uid).set(
      {
        role: "admin",
        status: "active",
        updatedAt: new Date(),
      },
      { merge: true }
    );

    console.log("\n\x1b[32m✔ SUCCESS: User has been promoted to Administrator!\x1b[0m");
    console.log(`Email: ${email}`);
    console.log(`UID:   ${userRecord.uid}`);
    console.log("\nImportant: The user must sign out and sign back in for the new ID token with claims to take effect.");
    process.exit(0);
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      console.error(`\x1b[31mError: No user found with email "${email}".\x1b[0m`);
      console.log("Please make sure the user has created an account first by signing up in the application.");
    } else {
      console.error("\x1b[31mBootstrap failed:\x1b[0m", err.message);
    }
    process.exit(1);
  }
}

bootstrapAdmin();

