import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const result: any = {
    status: "ok",
    nodeVersion: process.version,
    env: {
      has_FIREBASE_ADMIN_PROJECT_ID: Boolean(process.env.FIREBASE_ADMIN_PROJECT_ID),
      has_FIREBASE_ADMIN_CLIENT_EMAIL: Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL),
      has_FIREBASE_ADMIN_PRIVATE_KEY: Boolean(process.env.FIREBASE_ADMIN_PRIVATE_KEY),
      pk_length: process.env.FIREBASE_ADMIN_PRIVATE_KEY ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.length : 0,
      pk_has_begin: process.env.FIREBASE_ADMIN_PRIVATE_KEY
        ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.includes("BEGIN PRIVATE KEY")
        : false,
      has_NEXT_PUBLIC_FIREBASE_PROJECT_ID: Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || null,
      has_SERVICE_ACCOUNT: Boolean(
        process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_ADMIN_CREDENTIALS
      ),
    },
  };

  // Test dynamic import of firebase-admin
  try {
    const adminApp = await import("firebase-admin/app");
    result.firebaseAdminAppImport = "success";
    result.certExists = typeof adminApp.cert === "function";
  } catch (err: any) {
    result.firebaseAdminAppImport = "failed: " + (err?.message || String(err));
  }

  try {
    const adminFirestore = await import("firebase-admin/firestore");
    result.firebaseAdminFirestoreImport = "success";
    result.getFirestoreExists = typeof adminFirestore.getFirestore === "function";
  } catch (err: any) {
    result.firebaseAdminFirestoreImport = "failed: " + (err?.message || String(err));
  }

  // Test our admin module
  try {
    const { getAdminApp, getAdminDb } = await import("@/lib/firebase/admin");
    result.libAdminImport = "success";
    try {
      const app = getAdminApp();
      result.getAdminApp = "success: " + app.name;
    } catch (appErr: any) {
      result.getAdminApp = "failed: " + (appErr?.message || String(appErr));
    }

    try {
      const db = getAdminDb();
      result.getAdminDb = "initialized";
      const snap = await db.collection("courses").limit(1).get();
      result.firestoreQuery = `success: ${snap.size} docs`;
    } catch (dbErr: any) {
      result.firestoreQuery = "failed: " + (dbErr?.message || String(dbErr));
    }
  } catch (modErr: any) {
    result.libAdminImport = "failed: " + (modErr?.message || String(modErr));
  }

  return NextResponse.json(result);
}

