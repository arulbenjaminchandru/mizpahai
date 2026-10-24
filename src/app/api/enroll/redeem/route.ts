import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/server-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { enrollmentRedemptionSchema } from "@/lib/validations";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Basic in-memory IP/User rate limiting store for redemption attempts
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required to redeem code" },
      { status: 401 }
    );
  }

  if (user.status === "suspended") {
    return NextResponse.json(
      { error: "Account suspended. Contact support." },
      { status: 403 }
    );
  }

  // Rate limit by UID to prevent brute-force code guessing
  if (!checkRateLimit(`redeem_${user.uid}`, 6, 60000)) {
    return NextResponse.json(
      { error: "Too many redemption attempts. Please wait 1 minute before trying again." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const validated = enrollmentRedemptionSchema.parse(body);
    const targetCode = validated.code.trim().toUpperCase();

    const db = getAdminDb();

    // Query for the enrollment code document
    const codeQuery = await db
      .collection("enrollmentCodes")
      .where("code", "==", targetCode)
      .limit(1)
      .get();

    if (codeQuery.empty) {
      return NextResponse.json(
        { error: "Invalid enrollment code. Please check your spelling and try again." },
        { status: 400 }
      );
    }

    const codeDoc = codeQuery.docs[0];
    const codeRef = codeDoc.ref;
    const courseId = codeDoc.data().courseId;
    const batchName = codeDoc.data().batchName;
    const enrollmentId = `${user.uid}_${courseId}`;
    const enrollmentRef = db.collection("enrollments").doc(enrollmentId);

    // Run atomic transaction to safely handle concurrency and redemption limits
    const result = await db.runTransaction(async (transaction: any) => {
      const codeSnapshot = await transaction.get(codeRef);
      if (!codeSnapshot.exists) {
        throw new Error("Enrollment code does not exist.");
      }

      const codeData = codeSnapshot.data()!;

      // 1. Check status
      if (codeData.status === "revoked") {
        throw new Error("This enrollment code has been revoked by the administrator.");
      }

      // 2. Check expiration
      if (codeData.expiresAt) {
        const expiresAt = (codeData.expiresAt as Timestamp).toDate();
        if (new Date() > expiresAt) {
          transaction.update(codeRef, { status: "expired" });
          throw new Error("This enrollment code has expired.");
        }
      }

      // 3. Check redemption capacity
      const maxRedemptions = codeData.maxRedemptions || 1;
      const currentRedemptions = codeData.currentRedemptions || 0;

      if (currentRedemptions >= maxRedemptions) {
        transaction.update(codeRef, { status: "expired" });
        throw new Error("This enrollment code has already reached its maximum redemptions limit.");
      }

      // 4. Check if student already used this specific code
      const redeemedBy: string[] = codeData.redeemedBy || [];
      if (redeemedBy.includes(user.uid)) {
        throw new Error("You have already redeemed this code.");
      }

      // 5. Check if user is already enrolled in this course
      const existingEnrollment = await transaction.get(enrollmentRef);
      if (existingEnrollment.exists) {
        throw new Error("You are already enrolled in this course.");
      }

      // 6. Update code redemptions
      const nextRedemptions = currentRedemptions + 1;
      const isNowExhausted = nextRedemptions >= maxRedemptions;

      transaction.update(codeRef, {
        currentRedemptions: nextRedemptions,
        redeemedBy: FieldValue.arrayUnion(user.uid),
        status: isNowExhausted ? "expired" : codeData.status,
      });

      // 7. Create enrollment document
      transaction.set(enrollmentRef, {
        userId: user.uid,
        courseId,
        batchName: batchName || "Standard Cohort",
        enrollmentCodeId: codeDoc.id,
        enrolledAt: FieldValue.serverTimestamp(),
        status: "active",
      });

      return {
        courseId,
        batchName,
      };
    });

    // Fetch course title for helpful success message
    const courseDoc = await db.collection("courses").doc(result.courseId).get();
    const courseName = courseDoc.exists ? courseDoc.data()?.name : "Course";

    return NextResponse.json({
      success: true,
      courseId: result.courseId,
      courseName,
      batchName: result.batchName,
      message: `Congratulations! You have been successfully enrolled in "${courseName}".`,
    });
  } catch (error: any) {
    console.error("Redemption error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to redeem code" },
      { status: 400 }
    );
  }
}
