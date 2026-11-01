import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/server-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  courseEnquiryCreateSchema,
  calculateDiscountPercentage,
  generateWhatsAppEnquiryUrl,
} from "@/lib/validations";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

// In-memory rate limiting map for enquiry creations
const enquiryRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const record = enquiryRateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    enquiryRateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}

export async function GET(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection("courseEnquiries")
      .where("userId", "==", user.uid)
      .get();

    const enquiries = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ enquiries });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || "Failed to load enquiries",
      code: error?.code,
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.status === "suspended") {
    return NextResponse.json(
      { error: "Account suspended. Contact support." },
      { status: 403 }
    );
  }

  // Rate limiting by UID: max 5 enquiries per minute
  if (!checkRateLimit(`enquiry_${user.uid}`, 5, 60000)) {
    return NextResponse.json(
      { error: "Too many enquiry requests. Please wait a minute." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const validated = courseEnquiryCreateSchema.parse(body);
    const db = getAdminDb();

    // 1. Fetch Course
    const courseDoc = await db.collection("courses").doc(validated.courseId).get();
    if (!courseDoc.exists) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    const courseData = courseDoc.data()!;
    if (!courseData.isPublished) {
      return NextResponse.json(
        { error: "This course is currently not open for enrollment." },
        { status: 400 }
      );
    }

    // 2. Fetch User Profile from Firestore to get clean student name and phone
    const userDoc = await db.collection("users").doc(user.uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const studentName = userData?.displayName || user.email?.split("@")[0] || "Student";
    const studentEmail = user.email || userData?.email || "";
    const studentPhoneNumber = userData?.phoneNumber || null;

    // 3. Compute price snapshots
    const actualPrice =
      typeof courseData.actualPrice === "number" ? courseData.actualPrice : 15000;
    const currentPrice =
      typeof courseData.currentPrice === "number" ? courseData.currentPrice : 7999;
    const discountSnapshot = calculateDiscountPercentage(actualPrice, currentPrice);

    // 4. Fetch Configured WhatsApp Business Number if available
    let whatsappNumber = "+919894481283";
    try {
      const settingsDoc = await db.collection("settings").doc("contact").get();
      if (settingsDoc.exists && settingsDoc.data()?.whatsappNumber) {
        whatsappNumber = settingsDoc.data()!.whatsappNumber;
      }
    } catch {
      // Fallback remains +919894481283
    }

    // 5. Generate WhatsApp URL
    const whatsappUrl = generateWhatsAppEnquiryUrl({
      courseName: courseData.name || "Course",
      actualPrice,
      currentPrice,
      discountPercentage: discountSnapshot,
      studentName,
      studentEmail,
      whatsappNumber,
    });

    // 6. Check for existing active/pending enquiry (idempotency check)
    const existingSnap = await db
      .collection("courseEnquiries")
      .where("userId", "==", user.uid)
      .where("courseId", "==", validated.courseId)
      .get();

    const activePendingStatuses = [
      "new",
      "contacted",
      "awaiting_payment",
      "payment_under_verification",
    ];

    const pendingEnquiry = existingSnap.docs.find((d: any) =>
      activePendingStatuses.includes(d.data().status)
    );

    if (pendingEnquiry) {
      return NextResponse.json({
        success: true,
        alreadyPending: true,
        enquiry: { id: pendingEnquiry.id, ...pendingEnquiry.data() },
        whatsappUrl,
        message: "Your purchase enquiry is already under review. Proceed to WhatsApp to continue.",
      });
    }

    // 7. Create new enquiry document
    const enquiryRef = db.collection("courseEnquiries").doc();
    const newEnquiry = {
      userId: user.uid,
      studentName,
      studentEmail,
      studentPhoneNumber,
      courseId: validated.courseId,
      courseNameSnapshot: courseData.name || "Course",
      actualPriceSnapshot: actualPrice,
      currentPriceSnapshot: currentPrice,
      discountSnapshot,
      status: "new",
      adminNotes: "",
      paymentConfirmedAt: null,
      paymentConfirmedBy: null,
      accessGrantedAt: null,
      accessGrantedBy: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await enquiryRef.set(newEnquiry);

    return NextResponse.json({
      success: true,
      enquiry: { id: enquiryRef.id, ...newEnquiry },
      whatsappUrl,
      message: "Your course enquiry has been submitted! Continue to WhatsApp for enrollment details.",
    });
  } catch (error: any) {
    console.error("Enquiry creation error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to submit course enquiry",
        code: error?.code,
      },
      { status: 400 }
    );
  }
}
