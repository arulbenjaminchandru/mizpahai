import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server-auth";
import { getAdminApp, getAdminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 403 });
  }

  const rawProjectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const rawClientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  const envDiagnostics = {
    hasProjectId: !!rawProjectId,
    projectIdPrefix: rawProjectId ? rawProjectId.slice(0, 8) + "..." : null,
    hasClientEmail: !!rawClientEmail,
    clientEmailDomain: rawClientEmail ? rawClientEmail.split("@")[1] : null,
    hasPrivateKey: !!rawPrivateKey,
    privateKeyLength: rawPrivateKey ? rawPrivateKey.length : 0,
    privateKeyHasHeader: rawPrivateKey ? rawPrivateKey.includes("BEGIN PRIVATE KEY") : false,
    privateKeyHasFooter: rawPrivateKey ? rawPrivateKey.includes("END PRIVATE KEY") : false,
    hasJsonCredentials: !!(
      process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_ADMIN_CREDENTIALS
    ),
  };

  const firestoreProbes: Record<string, { ok: boolean; count?: number; error?: string }> = {};

  try {
    const db = getAdminDb();

    // Probe courses
    try {
      const snap = await db.collection("courses").limit(2).get();
      firestoreProbes.courses = { ok: true, count: snap.size };
    } catch (e: any) {
      firestoreProbes.courses = { ok: false, error: e?.message || String(e) };
    }

    // Probe liveClasses
    try {
      const snap = await db.collection("liveClasses").limit(2).get();
      firestoreProbes.liveClasses = { ok: true, count: snap.size };
    } catch (e: any) {
      firestoreProbes.liveClasses = { ok: false, error: e?.message || String(e) };
    }

    // Probe courseEnquiries
    try {
      const snap = await db.collection("courseEnquiries").limit(2).get();
      firestoreProbes.courseEnquiries = { ok: true, count: snap.size };
    } catch (e: any) {
      firestoreProbes.courseEnquiries = { ok: false, error: e?.message || String(e) };
    }

    // Probe users
    try {
      const snap = await db.collection("users").limit(2).get();
      firestoreProbes.users = { ok: true, count: snap.size };
    } catch (e: any) {
      firestoreProbes.users = { ok: false, error: e?.message || String(e) };
    }
  } catch (appErr: any) {
    return NextResponse.json({
      status: "error",
      message: "Firebase Admin App initialization threw an exception",
      env: envDiagnostics,
      error: appErr?.message || String(appErr),
    }, { status: 500 });
  }

  return NextResponse.json({
    status: "ok",
    adminUser: {
      uid: admin.uid,
      email: admin.email,
      role: admin.role,
      isAdmin: admin.isAdmin,
    },
    env: envDiagnostics,
    probes: firestoreProbes,
    timestamp: new Date().toISOString(),
  });
}

