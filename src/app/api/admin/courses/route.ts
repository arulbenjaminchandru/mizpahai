import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { courseSchema } from "@/lib/validations";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const db = getAdminDb();
    let snapshot;
    try {
      snapshot = await db.collection("courses").orderBy("createdAt", "desc").get();
    } catch {
      snapshot = await db.collection("courses").get();
    }
    const courses = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return NextResponse.json({ courses });
  } catch (error: any) {
    console.error("Courses list error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = courseSchema.parse(body);

    const db = getAdminDb();
    const docRef = await db.collection("courses").add({
      ...validated,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: "Course created successfully",
    });
  } catch (error: any) {
    console.error("Course create error:", error);
    return NextResponse.json(
      { error: error.errors ? error.errors[0].message : error.message },
      { status: 400 }
    );
  }
}
