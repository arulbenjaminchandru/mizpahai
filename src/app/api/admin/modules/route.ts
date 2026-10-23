import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { moduleSchema } from "@/lib/validations";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = moduleSchema.parse(body);

    const db = getAdminDb();
    const docRef = await db.collection("modules").add({
      ...validated,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: "Module created successfully",
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
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: "Module ID is required" }, { status: 400 });
    }

    const db = getAdminDb();
    await db.collection("modules").doc(id).update(data);
    return NextResponse.json({ success: true, message: "Module updated" });
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
      return NextResponse.json({ error: "Module ID is required" }, { status: 400 });
    }

    const db = getAdminDb();
    await db.collection("modules").doc(id).delete();
    return NextResponse.json({ success: true, message: "Module deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

