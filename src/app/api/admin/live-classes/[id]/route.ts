import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { liveClassSchema } from "@/lib/validations";
import { FieldValue } from "firebase-admin/firestore";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/live-classes/[id]
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const adminDb = getAdminDb();
    const doc = await adminDb.collection("liveClasses").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Live class not found" }, { status: 404 });
    }

    return NextResponse.json({
      class: {
        id: doc.id,
        ...doc.data(),
      },
    });
  } catch (error: any) {
    console.error("Error fetching live class:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/live-classes/[id]
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const partialSchema = liveClassSchema.partial();
    const result = partialSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();
    const docRef = adminDb.collection("liveClasses").doc(id);
    const existing = await docRef.get();

    if (!existing.exists) {
      return NextResponse.json({ error: "Live class not found" }, { status: 404 });
    }

    await docRef.update({
      ...result.data,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: admin.email || admin.uid,
    });

    return NextResponse.json({ success: true, message: "Live class updated successfully" });
  } catch (error: any) {
    console.error("Error updating live class:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/live-classes/[id]
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const adminDb = getAdminDb();
    const docRef = adminDb.collection("liveClasses").doc(id);
    const existing = await docRef.get();

    if (!existing.exists) {
      return NextResponse.json({ error: "Live class not found" }, { status: 404 });
    }

    await docRef.delete();
    return NextResponse.json({ success: true, message: "Live class deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting live class:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

