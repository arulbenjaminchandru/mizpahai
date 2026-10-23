import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { enrollmentCodeSchema } from "@/lib/validations";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection("enrollmentCodes")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const codes = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      const rawCode = data.code || "";
      // Mask the code: show first 8 chars, mask the rest
      const maskedCode =
        rawCode.length > 8
          ? `${rawCode.substring(0, 8)}-••••••`
          : rawCode;

      return {
        id: doc.id,
        ...data,
        maskedCode,
        // Do not expose raw plain code in bulk list queries for security
        code: undefined,
      };
    });

    return NextResponse.json({ codes });
  } catch (error: any) {
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
    const validated = enrollmentCodeSchema.parse(body);

    // Generate cryptographically secure random segment (e.g. 6 alphanumeric chars)
    const randomSegment = crypto.randomBytes(3).toString("hex").toUpperCase();
    const prefix = validated.prefix ? validated.prefix.toUpperCase() : "DH";
    const fullCode = `${prefix}-${validated.batchName.replace(/\s+/g, "")}-${randomSegment}`;

    const db = getAdminDb();
    const expiresAtDate = new Date(validated.expiresAt);

    const docRef = await db.collection("enrollmentCodes").add({
      code: fullCode,
      codePrefix: prefix,
      courseId: validated.courseId,
      batchName: validated.batchName,
      maxRedemptions: validated.maxRedemptions || 1,
      currentRedemptions: 0,
      expiresAt: Timestamp.fromDate(expiresAtDate),
      status: "active",
      createdBy: admin.uid,
      redeemedBy: [],
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      id: docRef.id,
      generatedCode: fullCode, // Return the unmasked code once so admin can copy it!
      message: "Enrollment code generated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.errors ? error.errors[0].message : error.message },
      { status: 400 }
    );
  }
}

// Revoke code action
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id, status } = await req.json();
    if (!id || !["active", "revoked"].includes(status)) {
      return NextResponse.json({ error: "Invalid code ID or status" }, { status: 400 });
    }

    const db = getAdminDb();
    await db.collection("enrollmentCodes").doc(id).update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: `Enrollment code status changed to ${status}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
