import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, secret } = body;

    const expectedSecret = process.env.ADMIN_BOOTSTRAP_SECRET || "MizpahAdminSecret2026!";

    if (!secret || secret !== expectedSecret) {
      return NextResponse.json(
        { error: "Invalid bootstrap secret. Access denied." },
        { status: 401 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (lookupErr: any) {
      if (lookupErr?.code === "auth/user-not-found") {
        return NextResponse.json(
          {
            error: `No user found with email "${email}". Please register an account on Mizpah AI first, then run bootstrap.`,
          },
          { status: 404 }
        );
      }
      throw lookupErr;
    }

    // Set Firebase Auth custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
      role: "admin",
      admin: true,
    });

    // Update Firestore user document
    await db.collection("users").doc(userRecord.uid).set(
      {
        role: "admin",
        status: "active",
        email: userRecord.email,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      message: "User successfully promoted to Administrator.",
      uid: userRecord.uid,
      email: userRecord.email,
      role: "admin",
      notice: "Please sign out and sign back in to refresh your token claims.",
    });
  } catch (error: any) {
    console.error("Bootstrap error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to bootstrap administrator." },
      { status: 500 }
    );
  }
}

