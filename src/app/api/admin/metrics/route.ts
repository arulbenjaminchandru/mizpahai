import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server-auth";
import { getAdminDb } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const db = getAdminDb();

    // Query counts in parallel
    const [usersSnap, enrollmentsSnap, coursesSnap, lessonsSnap, progressSnap] =
      await Promise.all([
        db.collection("users").count().get(),
        db.collection("enrollments").count().get(),
        db.collection("courses").count().get(),
        db.collection("lessons").count().get(),
        db.collection("lessonProgress").where("completed", "==", true).count().get(),
      ]);

    return NextResponse.json({
      totalStudents: usersSnap.data().count,
      activeEnrollments: enrollmentsSnap.data().count,
      totalCourses: coursesSnap.data().count,
      totalLessons: lessonsSnap.data().count,
      totalCompletions: progressSnap.data().count,
    });
  } catch (error: any) {
    console.error("Metrics fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics", details: error.message },
      { status: 500 }
    );
  }
}

