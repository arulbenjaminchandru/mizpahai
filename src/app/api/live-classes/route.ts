import { type NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/server-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import type { LiveClass } from "@/types";

/**
 * GET /api/live-classes
 * Retrieves scheduled live classes ONLY for courses where the student has:
 * 1. An active course enrollment.
 * 2. Explicit approved live-class permission (verified against liveClassAccess collection).
 * 3. Class is marked isActive === true and isPublished === true.
 *
 * CRITICAL SECURITY ASSURANCE:
 * Meeting URLs are NEVER exposed to unapproved students, unregistered users, or cross-course participants.
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await verifyAuth(req);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to view live classes." },
        { status: 401 }
      );
    }

    const adminDb = getAdminDb();

    // 1. Fetch user's active enrollments
    const enrollmentsSnap = await adminDb
      .collection("enrollments")
      .where("userId", "==", authUser.uid)
      .where("status", "==", "active")
      .get();

    const enrolledCourseIds = enrollmentsSnap.docs.map((d) => d.data().courseId);
    if (enrolledCourseIds.length === 0) {
      return NextResponse.json({
        classes: [],
        enrolledCount: 0,
        approvedCourseCount: 0,
        unapprovedCourses: [],
      });
    }

    // 2. Fetch courses info
    const coursesSnap = await adminDb.collection("courses").get();
    const courseMap: Record<string, string> = {};
    coursesSnap.docs.forEach((d) => {
      courseMap[d.id] = d.data().name || "Cohort Course";
    });

    // 3. Check explicit approval in liveClassAccess collection
    // Admins bypass approval for previewing; students must be explicitly approved
    const approvedCourseIds = new Set<string>();
    const unapprovedCourses: { courseId: string; courseName: string }[] = [];

    if (authUser.isAdmin) {
      enrolledCourseIds.forEach((id) => approvedCourseIds.add(id));
    } else {
      for (const cId of enrolledCourseIds) {
        const accessDocId = `${cId}_${authUser.uid}`;
        const accessDoc = await adminDb
          .collection("liveClassAccess")
          .doc(accessDocId)
          .get();

        if (accessDoc.exists && accessDoc.data()?.approved === true) {
          approvedCourseIds.add(cId);
        } else {
          unapprovedCourses.push({
            courseId: cId,
            courseName: courseMap[cId] || "Course",
          });
        }
      }
    }

    if (approvedCourseIds.size === 0) {
      return NextResponse.json({
        classes: [],
        enrolledCount: enrolledCourseIds.length,
        approvedCourseCount: 0,
        unapprovedCourses,
      });
    }

    // 4. Fetch active and published live classes for approved courses only
    const authorizedClasses: LiveClass[] = [];
    for (const cId of Array.from(approvedCourseIds)) {
      const liveSnap = await adminDb
        .collection("liveClasses")
        .where("courseId", "==", cId)
        .where("isActive", "==", true)
        .where("isPublished", "==", true)
        .get();

      liveSnap.docs.forEach((doc) => {
        const data = doc.data();
        authorizedClasses.push({
          id: doc.id,
          courseId: data.courseId,
          courseName: courseMap[data.courseId] || "Cohort Live Class",
          title: data.title,
          description: data.description || "",
          meetingUrl: data.meetingUrl,
          meetingPlatform: data.meetingPlatform || "google-meet",
          scheduledDate: data.scheduledDate,
          startTime: data.startTime,
          endTime: data.endTime || "",
          isActive: data.isActive,
          isPublished: data.isPublished,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
    }

    // Sort by scheduledDate then startTime ascending
    authorizedClasses.sort((a, b) => {
      const dateCompare = a.scheduledDate.localeCompare(b.scheduledDate);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });

    return NextResponse.json({
      classes: authorizedClasses,
      enrolledCount: enrolledCourseIds.length,
      approvedCourseCount: approvedCourseIds.size,
      unapprovedCourses,
    });
  } catch (error: any) {
    console.error("Error fetching student live classes:", error);
    return NextResponse.json(
      { error: "Internal server error fetching live classes" },
      { status: 500 }
    );
  }
}

