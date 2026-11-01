import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin, verifyAuth } from "@/lib/auth/server-auth";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const db = getAdminDb();
    const doc = await db.collection("settings").doc("contact").get();
    const defaultWhatsApp = "+919894481283";

    if (!doc.exists) {
      return NextResponse.json({
        whatsappNumber: defaultWhatsApp,
      });
    }

    return NextResponse.json({
      whatsappNumber: doc.data()?.whatsappNumber || defaultWhatsApp,
      updatedAt: doc.data()?.updatedAt,
    });
  } catch (error: any) {
    return NextResponse.json({
      whatsappNumber: "+919894481283",
    });
  }
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { whatsappNumber } = body;

    if (!whatsappNumber || typeof whatsappNumber !== "string") {
      return NextResponse.json(
        { error: "Valid WhatsApp number is required" },
        { status: 400 }
      );
    }

    const cleanNumber = whatsappNumber.trim();
    const db = getAdminDb();

    await db.collection("settings").doc("contact").set(
      {
        whatsappNumber: cleanNumber,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: admin.uid,
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      whatsappNumber: cleanNumber,
      message: "Contact settings updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

