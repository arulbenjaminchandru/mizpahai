import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { lessonSchema, extractYouTubeVideoId } from "@/lib/validations";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = lessonSchema.parse(body);

    const videoId = extractYouTubeVideoId(validated.youtubeUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL format" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const docRef = await db.collection("lessons").add({
      moduleId: validated.moduleId,
      weekId: validated.weekId,
      courseId: validated.courseId,
      title: validated.title,
      description: validated.description || "",
      youtubeVideoId: videoId,
      duration: validated.duration || 0,
      orderIndex: validated.orderIndex || 0,
      isPublished: validated.isPublished ?? false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      id: docRef.id,
      videoId,
      message: "Lesson created successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.errors ? error.errors[0].message : error.message },
      { status: 400 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, youtubeUrl, ...rest } = body;
    if (!id) {
      return NextResponse.json({ error: "Lesson ID is required" }, { status: 400 });
    }

    const updateData: any = {
      ...rest,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (youtubeUrl) {
      const videoId = extractYouTubeVideoId(youtubeUrl);
      if (!videoId) {
        return NextResponse.json(
          { error: "Invalid YouTube URL format" },
          { status: 400 }
        );
      }
      updateData.youtubeVideoId = videoId;
    }

    const db = getAdminDb();
    await db.collection("lessons").doc(id).update(updateData);
    return NextResponse.json({ success: true, message: "Lesson updated" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Lesson ID is required" }, { status: 400 });
    }

    const db = getAdminDb();
    await db.collection("lessons").doc(id).delete();
    return NextResponse.json({ success: true, message: "Lesson deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

