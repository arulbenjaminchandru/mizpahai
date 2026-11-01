import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { liveClassApprovalSchema } from "@/lib/validations";
import { FieldValue } from "firebase-admin/firestore";

/**
 * GET /api/admin/live-classes/participants?courseId=...
 * Lists all students enrolled in a specific course along with their live-class access approval status.
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    if (!courseId) {
      return NextResponse.json({ error: "courseId parameter is required" }, { status: 400 });
    }

    const adminDb = getAdminDb();

    // 1. Fetch enrollments for course
    const enrollmentsSnap = await adminDb
      .collection("enrollments")
      .where("courseId", "==", courseId)
      .get();

    if (enrollmentsSnap.empty) {
      return NextResponse.json({ participants: [] });
    }

    const userIds = enrollmentsSnap.docs.map((d) => d.data().userId);

    // 2. Fetch user profile docs and access docs in parallel
    const [usersSnap, accessSnap] = await Promise.all([
      adminDb.collection("users").get(),
      adminDb.collection("liveClassAccess").where("courseId", "==", courseId).get(),
    ]);

    const userMap: Record<string, any> = {};
    usersSnap.docs.forEach((d) => {
      userMap[d.id] = d.data();
    });

    const accessMap: Record<string, any> = {};
    accessSnap.docs.forEach((d) => {
      accessMap[d.data().userId] = d.data();
    });

    const participants = enrollmentsSnap.docs.map((enrDoc) => {
      const enr = enrDoc.data();
      const u = userMap[enr.userId] || {};
      const access = accessMap[enr.userId];

      return {
        userId: enr.userId,
        enrollmentId: enrDoc.id,
        courseId,
        displayName: u.displayName || "Student",
        email: u.email || "No email",
        phoneNumber: u.phoneNumber || null,
        batchName: enr.batchName || "Cohort 2026",
        enrolledAt: enr.enrolledAt,
        approved: access ? access.approved !== false && access.status !== "revoked" : true,
        approvedAt: access?.approvedAt || null,
        approvedBy: access?.approvedBy || null,
        revokedAt: access?.revokedAt || null,
        revokedBy: access?.revokedBy || null,
      };
    });

    return NextResponse.json({ participants });
  } catch (error: any) {
    console.error("Error fetching live class participants:", error);
    return NextResponse.json(
      { error: "Internal server error fetching participants" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/live-classes/participants
 * Approves or revokes live-class access for one or more participants.
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const result = liveClassApprovalSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { courseId, userIds, approved } = result.data;
    const adminDb = getAdminDb();
    const batch = adminDb.batch();

    // Fetch user profiles for denormalizing names/emails into audit trail
    const usersSnap = await adminDb.collection("users").get();
    const userMap: Record<string, any> = {};
    usersSnap.docs.forEach((d) => {
      userMap[d.id] = d.data();
    });

    const now = FieldValue.serverTimestamp();
    const adminIdentifier = admin.email || admin.uid;

    for (const uId of userIds) {
      const docId = `${courseId}_${uId}`;
      const docRef = adminDb.collection("liveClassAccess").doc(docId);
      const u = userMap[uId] || {};

      if (approved) {
        batch.set(
          docRef,
          {
            id: docId,
            courseId,
            userId: uId,
            studentEmail: u.email || "",
            studentName: u.displayName || "",
            approved: true,
            approvedAt: now,
            approvedBy: adminIdentifier,
            revokedAt: null,
            revokedBy: null,
            updatedAt: now,
          },
          { merge: true }
        );
      } else {
        batch.set(
          docRef,
          {
            id: docId,
            courseId,
            userId: uId,
            studentEmail: u.email || "",
            studentName: u.displayName || "",
            approved: false,
            revokedAt: now,
            revokedBy: adminIdentifier,
            updatedAt: now,
          },
          { merge: true }
        );
      }
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Successfully ${approved ? "approved" : "revoked"} live-class access for ${userIds.length} participant(s).`,
      count: userIds.length,
      approved,
    });
  } catch (error: any) {
    console.error("Error updating live class participant access:", error);
    return NextResponse.json(
      { error: "Internal server error updating participant access" },
      { status: 500 }
    );
  }
}

