import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  calculateDiscountPercentage,
  validateGoogleDriveBrochureUrl,
} from "@/lib/validations";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const db = getAdminDb();
    const doc = await db.collection("courses").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    return NextResponse.json({ course: { id: doc.id, ...doc.data() } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const db = getAdminDb();

    const updatePayload: Record<string, any> = {
      ...body,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Server-side validation for pricing
    if (
      typeof body.actualPrice !== "undefined" ||
      typeof body.currentPrice !== "undefined"
    ) {
      const actual = Number(body.actualPrice);
      const current = Number(body.currentPrice);

      if (isNaN(actual) || isNaN(current)) {
        return NextResponse.json(
          { error: "Pricing values must be numbers." },
          { status: 400 }
        );
      }

      if (actual < 0 || current < 0) {
        return NextResponse.json(
          { error: "Course prices cannot be negative." },
          { status: 400 }
        );
      }

      if (current > actual) {
        return NextResponse.json(
          { error: "Current offer price cannot exceed actual course price." },
          { status: 400 }
        );
      }

      updatePayload.actualPrice = actual;
      updatePayload.currentPrice = current;
      updatePayload.discountPercentage = calculateDiscountPercentage(
        actual,
        current
      );
    }

    // Server-side validation for brochure URL
    if (body.brochureUrl && typeof body.brochureUrl === "string" && body.brochureUrl.trim() !== "") {
      if (!validateGoogleDriveBrochureUrl(body.brochureUrl)) {
        return NextResponse.json(
          { error: "Invalid brochure URL. Must be a legitimate HTTPS Google Drive link." },
          { status: 400 }
        );
      }
    }

    await db.collection("courses").doc(id).update(updatePayload);

    return NextResponse.json({
      success: true,
      message: "Course updated successfully",
      course: updatePayload,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const db = getAdminDb();
    await db.collection("courses").doc(id).delete();
    return NextResponse.json({ success: true, message: "Course deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

