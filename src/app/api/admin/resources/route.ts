import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { resourceSchema, validateDriveUrl } from "@/lib/validations";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = resourceSchema.parse(body);

    if (!validateDriveUrl(validated.driveUrl)) {
      return NextResponse.json(
        { error: "Must be a valid Google Drive URL (drive.google.com or docs.google.com)" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const docRef = await db.collection("resources").add({
      courseId: validated.courseId,
      weekId: validated.weekId,
      lessonId: validated.lessonId || null,
      title: validated.title,
      description: validated.description || "",
      fileType: validated.fileType,
      category: validated.category,
      driveUrl: validated.driveUrl,
      orderIndex: validated.orderIndex || 0,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: "Resource attached successfully",
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
    const { id, driveUrl, ...rest } = body;
    if (!id) {
      return NextResponse.json({ error: "Resource ID is required" }, { status: 400 });
    }

    if (driveUrl && !validateDriveUrl(driveUrl)) {
      return NextResponse.json(
        { error: "Invalid Google Drive URL" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const updateData = driveUrl ? { ...rest, driveUrl } : rest;
    await db.collection("resources").doc(id).update(updateData);

    return NextResponse.json({ success: true, message: "Resource updated" });
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
      return NextResponse.json({ error: "Resource ID is required" }, { status: 400 });
    }

    const db = getAdminDb();
    await db.collection("resources").doc(id).delete();
    return NextResponse.json({ success: true, message: "Resource deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

