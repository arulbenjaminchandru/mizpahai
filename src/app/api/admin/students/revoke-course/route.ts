import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { courseAccessRevokeSchema } from "@/lib/validations";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = courseAccessRevokeSchema.parse(body);
    const { userId, courseId, reason } = validated;

    const db = getAdminDb();
    const enrollmentId = `${userId}_${courseId}`;
    const enrollmentRef = db.collection("enrollments").doc(enrollmentId);

    const enrollmentDoc = await enrollmentRef.get();
    if (!enrollmentDoc.exists) {
      return NextResponse.json(
        { error: "Enrollment record not found for this course and student." },
        { status: 404 }
      );
    }

    const currentEnrollment = enrollmentDoc.data()!;
    const previousStatus = currentEnrollment.status || "active";

    // Fetch Student and Course data for audit logging
    const [studentDoc, courseDoc] = await Promise.all([
      db.collection("users").doc(userId).get(),
      db.collection("courses").doc(courseId).get(),
    ]);

    const studentData = studentDoc.exists ? studentDoc.data() : null;
    const courseData = courseDoc.exists ? courseDoc.data() : null;
    const studentName = studentData?.displayName || "Student";
    const studentEmail = studentData?.email || "";
    const courseName = courseData?.name || "Course";

    // Atomically revoke only this specific course enrollment & log audit
    await db.runTransaction(async (transaction: any) => {
      // 1. Mark enrollment as revoked
      transaction.update(enrollmentRef, {
        status: "revoked",
        revokedAt: FieldValue.serverTimestamp(),
        revokedBy: admin.uid,
        revokedByEmail: admin.email || "Admin",
        revocationReason: reason || "Revoked by administrator",
      });

      // 2. Add audit entry
      const auditRef = db.collection("courseAccessAudits").doc();
      transaction.set(auditRef, {
        userId,
        courseId,
        enrollmentId,
        studentName,
        studentEmail,
        courseName,
        action: "revoked",
        previousStatus,
        newStatus: "revoked",
        performedBy: admin.uid,
        performedByEmail: admin.email || "Admin",
        reason: reason || "Revoked by administrator",
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({
      success: true,
      message: `Access to "${courseName}" has been revoked for ${studentName}.`,
    });
  } catch (error: any) {
    console.error("Revoke course access error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to revoke course access" },
      { status: 400 }
    );
  }
}
