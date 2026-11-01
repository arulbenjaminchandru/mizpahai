import {
  initializeApp,
  getApps,
  cert,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App | null = null;
let adminAuthInstance: Auth | null = null;
let adminDbInstance: Firestore | null = null;

function cleanString(val?: string): string | undefined {
  if (!val) return undefined;
  let s = val.trim();
  while (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'")) ||
    (s.startsWith('\\"') && s.endsWith('\\"'))
  ) {
    if (s.startsWith('\\"') && s.endsWith('\\"')) {
      s = s.slice(2, -2).trim();
    } else {
      s = s.slice(1, -1).trim();
    }
  }
  return s;
}

function cleanPrivateKey(rawKey?: string): string | undefined {
  if (!rawKey) return undefined;
  let k = rawKey.trim();

  // If user pasted a full JSON service account string into the env var
  if (k.startsWith("{") && k.endsWith("}")) {
    try {
      const parsed = JSON.parse(k);
      if (parsed.private_key) {
        k = parsed.private_key;
      }
    } catch {
      // not JSON, continue
    }
  }

  // Strip wrapping quotes (single, double, or escaped)
  while (
    (k.startsWith('"') && k.endsWith('"')) ||
    (k.startsWith("'") && k.endsWith("'")) ||
    (k.startsWith('\\"') && k.endsWith('\\"'))
  ) {
    if (k.startsWith('\\"') && k.endsWith('\\"')) {
      k = k.slice(2, -2).trim();
    } else {
      k = k.slice(1, -1).trim();
    }
  }

  // Remove carriage returns from Windows CRLF
  k = k.replace(/\r/g, "");

  // Unescape literal \n or \\n into real newlines
  k = k.replace(/\\\\n/g, "\n").replace(/\\n/g, "\n");

  // Ensure standard trailing newline
  if (!k.endsWith("\n")) {
    k += "\n";
  }

  return k;
}

export function getAdminApp(): App {
  if (adminApp) return adminApp;

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  // 1. Support whole JSON credentials in single env variable
  const jsonCreds =
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.FIREBASE_ADMIN_CREDENTIALS;

  if (jsonCreds) {
    try {
      const parsed = JSON.parse(jsonCreds.trim());
      if (parsed.client_email && parsed.private_key) {
        adminApp = initializeApp({
          credential: cert({
            projectId: cleanString(parsed.project_id) || "data-horizon-academy-dev",
            clientEmail: cleanString(parsed.client_email)!,
            privateKey: cleanPrivateKey(parsed.private_key)!,
          }),
          projectId: cleanString(parsed.project_id) || "data-horizon-academy-dev",
        });
        return adminApp;
      }
    } catch (e) {
      console.warn("Failed to parse JSON service account credentials:", e);
    }
  }

  // 2. Standard individual environment variables
  const rawProjectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const rawClientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  const projectId = cleanString(rawProjectId) || "data-horizon-academy-dev";
  const clientEmail = cleanString(rawClientEmail);
  const privateKey = cleanPrivateKey(rawPrivateKey);

  if (projectId && clientEmail && privateKey) {
    try {
      const serviceAccount: ServiceAccount = {
        projectId,
        clientEmail,
        privateKey,
      };
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
      return adminApp;
    } catch (certError) {
      console.error("Firebase Admin cert() initialization failed:", certError);
    }
  }

  // Fallback: Initialize with project ID only (works in GCP/Firebase environments or local emulator)
  adminApp = initializeApp({
    projectId,
  });

  return adminApp;
}

export function getAdminAuth(): Auth {
  if (!adminAuthInstance) {
    adminAuthInstance = getAuth(getAdminApp());
  }
  return adminAuthInstance;
}

export function getAdminDb(): Firestore {
  if (!adminDbInstance) {
    adminDbInstance = getFirestore(getAdminApp());
  }
  return adminDbInstance;
}

// Proxied exports for backwards compatibility with direct imports
export const adminAuth = new Proxy({} as Auth, {
  get(_target, prop) {
    const auth = getAdminAuth();
    const val = (auth as any)[prop];
    return typeof val === "function" ? val.bind(auth) : val;
  },
});

export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop) {
    const db = getAdminDb();
    const val = (db as any)[prop];
    return typeof val === "function" ? val.bind(db) : val;
  },
});

export default adminApp;
