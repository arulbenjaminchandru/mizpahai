import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { liveClassSchema } from "@/lib/validations";
import { FieldValue } from "firebase-admin/firestore";
import type { LiveClass } from "@/types";

/**
 * GET /api/admin/live-classes
 * Retrieves live classes. Supports filtering by ?courseId=...
 * Accessible to authorized administrators only.
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    const adminDb = getAdminDb();
    let query: FirebaseFirestore.Query = adminDb.collection("liveClasses");

    if (courseId) {
      query = query.where("courseId", "==", courseId);
    }

    const [snapshot, coursesSnap] = await Promise.all([
      query.get(),
      adminDb.collection("courses").get(),
    ]);

    const courseMap: Record<string, string> = {};
    coursesSnap.docs.forEach((d) => {
      courseMap[d.id] = d.data().name || "Course";
    });

    const classes: LiveClass[] = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        courseId: data.courseId,
        courseName: courseMap[data.courseId] || "Course",
        title: data.title,
        description: data.description || "",
        meetingUrl: data.meetingUrl,
        meetingPlatform: data.meetingPlatform || "google-meet",
        scheduledDate: data.scheduledDate,
        startTime: data.startTime,
        endTime: data.endTime || "",
        isActive: data.isActive ?? true,
        isPublished: data.isPublished ?? true,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    });

    // Sort by scheduledDate descending
    classes.sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));

    return NextResponse.json({ classes });
  } catch (error: any) {
    console.error("Admin live classes GET error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching live classes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/live-classes
 * Creates a new live class with validated meeting URL.
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const result = liveClassSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;
    const adminDb = getAdminDb();

    // Verify course exists
    const courseDoc = await adminDb.collection("courses").doc(data.courseId).get();
    if (!courseDoc.exists) {
      return NextResponse.json({ error: "Selected course does not exist" }, { status: 404 });
    }

    const newDocRef = adminDb.collection("liveClasses").doc();
    await newDocRef.set({
      ...data,
      courseName: courseDoc.data()?.name || "Course",
      createdBy: admin.email || admin.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: "Live class created successfully",
      id: newDocRef.id,
    });
  } catch (error: any) {
    console.error("Admin live classes POST error:", error);
    return NextResponse.json(
      { error: "Internal server error creating live class" },
      { status: 500 }
    );
  }
}

