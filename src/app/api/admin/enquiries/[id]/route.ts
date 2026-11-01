import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { courseEnquiryAdminUpdateSchema } from "@/lib/validations";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const db = getAdminDb();
    const doc = await db.collection("courseEnquiries").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    return NextResponse.json({ enquiry: { id: doc.id, ...doc.data() } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const validated = courseEnquiryAdminUpdateSchema.parse(body);

    const db = getAdminDb();
    const enquiryRef = db.collection("courseEnquiries").doc(id);
    const doc = await enquiryRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    const currentData = doc.data()!;
    const updatePayload: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (validated.status) {
      updatePayload.status = validated.status;
    }

    if (typeof validated.adminNotes === "string") {
      updatePayload.adminNotes = validated.adminNotes;
    }

    // Manual Payment Confirmation
    if (validated.paymentConfirmed === true) {
      updatePayload.status = "payment_confirmed";
      updatePayload.paymentConfirmedAt = FieldValue.serverTimestamp();
      updatePayload.paymentConfirmedBy = admin.uid;
      updatePayload.paymentConfirmedByEmail = admin.email || "Admin";
      if (validated.paymentNotes) {
        updatePayload.paymentNotes = validated.paymentNotes;
      }
    }

    await enquiryRef.update(updatePayload);

    return NextResponse.json({
      success: true,
      message: "Enquiry updated successfully",
      enquiry: {
        id,
        ...currentData,
        ...updatePayload,
      },
    });
  } catch (error: any) {
    console.error("Enquiry update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update enquiry" },
      { status: 400 }
    );
  }
}
