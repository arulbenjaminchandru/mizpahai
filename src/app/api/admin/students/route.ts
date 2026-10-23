import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase();

    const db = getAdminDb();
    const snapshot = await db.collection("users").get();

    let students = snapshot.docs.map((doc: any) => ({
      uid: doc.id,
      ...doc.data(),
    }));

    if (search) {
      students = students.filter(
        (s: any) =>
          s.email?.toLowerCase().includes(search) ||
          s.displayName?.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ students });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update student status (active/suspended)
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { uid, status } = await req.json();
    if (!uid || !["active", "suspended"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid student UID or status" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    await db.collection("users").doc(uid).update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: `Student status updated to ${status}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Direct course assignment by Admin
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { userId, courseId, batchName } = await req.json();
    if (!userId || !courseId) {
      return NextResponse.json(
        { error: "userId and courseId are required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const enrollmentId = `${userId}_${courseId}`;

    await db.collection("enrollments").doc(enrollmentId).set({
      userId,
      courseId,
      batchName: batchName || "Batch 2026",
      enrollmentCodeId: "admin-direct-assignment",
      status: "active",
      enrolledAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: "Student directly assigned to course",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
