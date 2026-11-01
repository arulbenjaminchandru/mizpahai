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

    // Query counts & documents in parallel
    const [
      usersSnap,
      enrollmentsSnap,
      coursesSnap,
      lessonsSnap,
      liveClassesSnap,
      progressSnap,
    ] = await Promise.all([
      db.collection("users").get(),
      db.collection("enrollments").count().get(),
      db.collection("courses").count().get(),
      db.collection("lessons").count().get(),
      db.collection("liveClasses").count().get(),
      db.collection("lessonProgress").where("completed", "==", true).count().get(),
    ]);

    let usersWithPhone = 0;
    let usersMissingPhone = 0;

    usersSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.phoneNumber && String(data.phoneNumber).trim().length > 0) {
        usersWithPhone++;
      } else {
        usersMissingPhone++;
      }
    });

    const totalStudents = usersSnap.size;
    const profileCompletionRate =
      totalStudents > 0 ? Math.round((usersWithPhone / totalStudents) * 100) : 0;

    return NextResponse.json({
      totalStudents,
      activeEnrollments: enrollmentsSnap.data().count,
      totalCourses: coursesSnap.data().count,
      totalLessons: lessonsSnap.data().count,
      totalLiveClasses: liveClassesSnap.data().count,
      totalCompletions: progressSnap.data().count,
      usersWithPhone,
      usersMissingPhone,
      profileCompletionRate,
    });
  } catch (error: any) {
    console.error("Metrics fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics", details: error.message },
      { status: 500 }
    );
  }
}

