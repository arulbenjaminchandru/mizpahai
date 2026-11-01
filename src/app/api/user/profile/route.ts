import { type NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/server-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { profilePhoneUpdateSchema, formatToE164 } from "@/lib/validations";
import { FieldValue } from "firebase-admin/firestore";

/**
 * PATCH /api/user/profile
 * Allows authenticated users to safely update their own contact details (mobile number).
 * Strictly enforces that user can only modify their own UID record (from verified ID token).
 */
export async function PATCH(req: NextRequest) {
  try {
    const authUser = await verifyAuth(req);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to update your profile." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parseResult = profilePhoneUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { phoneNumber, countryCode } = parseResult.data;
    const e164Phone = formatToE164(countryCode, phoneNumber);

    const adminDb = getAdminDb();
    const userDocRef = adminDb.collection("users").doc(authUser.uid);

    await userDocRef.set(
      {
        phoneNumber: e164Phone,
        countryCode: countryCode || "+91",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      message: "Mobile number updated successfully.",
      profile: {
        uid: authUser.uid,
        phoneNumber: e164Phone,
        countryCode,
      },
    });
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Internal server error while updating profile" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/profile
 * Retrieves the currently authenticated user's profile from Firestore.
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await verifyAuth(req);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const adminDb = getAdminDb();
    const userDoc = await adminDb.collection("users").doc(authUser.uid).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const data = userDoc.data();
    return NextResponse.json({
      profile: {
        uid: authUser.uid,
        email: data?.email || authUser.email,
        displayName: data?.displayName || "",
        phoneNumber: data?.phoneNumber || null,
        countryCode: data?.countryCode || "+91",
        role: data?.role || "student",
        status: data?.status || "active",
        createdAt: data?.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

