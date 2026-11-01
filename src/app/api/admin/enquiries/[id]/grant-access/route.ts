import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const db = getAdminDb();

    // 1. Fetch Enquiry
    const enquiryRef = db.collection("courseEnquiries").doc(id);
    const enquiryDoc = await enquiryRef.get();

    if (!enquiryDoc.exists) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    const enquiry = enquiryDoc.data()!;
    const userId = enquiry.userId;
    const courseId = enquiry.courseId;

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: "Invalid enquiry: missing userId or courseId" },
        { status: 400 }
      );
    }

    // 2. Fetch Course to inherit batch name and title
    const courseDoc = await db.collection("courses").doc(courseId).get();
    const courseData = courseDoc.exists ? courseDoc.data() : null;
    const courseName = courseData?.name || enquiry.courseNameSnapshot || "Course";
    const batchName = courseData?.batchName || "Batch 2026";

    // 3. Fetch Student to inherit name/email for audit
    const studentDoc = await db.collection("users").doc(userId).get();
    const studentData = studentDoc.exists ? studentDoc.data() : null;
    const studentName = studentData?.displayName || enquiry.studentName || "Student";
    const studentEmail = studentData?.email || enquiry.studentEmail || "";

    const enrollmentId = `${userId}_${courseId}`;
    const enrollmentRef = db.collection("enrollments").doc(enrollmentId);

    // 4. Atomic transaction to grant course access & log audit record
    await db.runTransaction(async (transaction: any) => {
      const existingEnrollment = await transaction.get(enrollmentRef);
      const prevStatus = existingEnrollment.exists
        ? existingEnrollment.data()?.status
        : "none";

      // Set or update active enrollment
      transaction.set(
        enrollmentRef,
        {
          userId,
          courseId,
          batchName,
          enrollmentCodeId: "manual-admin-grant",
          status: "active",
          enrolledAt: existingEnrollment.exists
            ? existingEnrollment.data()?.enrolledAt || FieldValue.serverTimestamp()
            : FieldValue.serverTimestamp(),
          grantedBy: admin.uid,
          grantedByEmail: admin.email || "Admin",
          grantedAt: FieldValue.serverTimestamp(),
          revokedAt: null,
          revokedBy: null,
          revocationReason: null,
        },
        { merge: true }
      );

      // Update Enquiry Status
      transaction.update(enquiryRef, {
        status: "access_granted",
        accessGrantedAt: FieldValue.serverTimestamp(),
        accessGrantedBy: admin.uid,
        accessGrantedByEmail: admin.email || "Admin",
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Write Audit Log
      const auditRef = db.collection("courseAccessAudits").doc();
      transaction.set(auditRef, {
        userId,
        courseId,
        enrollmentId,
        studentName,
        studentEmail,
        action: "granted",
        previousStatus: prevStatus,
        newStatus: "active",
        performedBy: admin.uid,
        performedByEmail: admin.email || "Admin",
        enquiryId: id,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({
      success: true,
      message: `Course access to "${courseName}" has been successfully granted to ${studentName}.`,
      enrollmentId,
    });
  } catch (error: any) {
    console.error("Grant course access error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to grant course access" },
      { status: 500 }
    );
  }
}
