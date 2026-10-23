import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/server-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { lessonId, courseId, completed } = await req.json();
    if (!lessonId || !courseId) {
      return NextResponse.json(
        { error: "lessonId and courseId are required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const progressDocId = `${lessonId}_${user.uid}`;
    const progressRef = db.collection("lessonProgress").doc(progressDocId);

    const isCompleted = Boolean(completed);

    await progressRef.set({
      id: progressDocId,
      lessonId,
      userId: user.uid,
      courseId,
      completed: isCompleted,
      completedAt: isCompleted ? FieldValue.serverTimestamp() : null,
    });

    return NextResponse.json({
      success: true,
      completed: isCompleted,
      lessonId,
    });
  } catch (error: any) {
    console.error("Progress toggle error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

