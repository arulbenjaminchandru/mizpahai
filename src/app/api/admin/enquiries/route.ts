import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server-auth";
import { getAdminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.toLowerCase().trim();

    const db = getAdminDb();
    const snapshot = await db.collection("courseEnquiries").get();

    let enquiries = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calculate metrics before filtering
    const metrics = {
      total: enquiries.length,
      new: enquiries.filter((e: any) => e.status === "new").length,
      contacted: enquiries.filter((e: any) => e.status === "contacted").length,
      awaiting_payment: enquiries.filter((e: any) => e.status === "awaiting_payment").length,
      payment_under_verification: enquiries.filter(
        (e: any) => e.status === "payment_under_verification"
      ).length,
      payment_confirmed: enquiries.filter((e: any) => e.status === "payment_confirmed").length,
      access_granted: enquiries.filter((e: any) => e.status === "access_granted").length,
      rejected: enquiries.filter(
        (e: any) => e.status === "rejected" || e.status === "cancelled"
      ).length,
    };

    // Apply filters
    if (courseId && courseId !== "all") {
      enquiries = enquiries.filter((e: any) => e.courseId === courseId);
    }

    if (status && status !== "all") {
      enquiries = enquiries.filter((e: any) => e.status === status);
    }

    if (search) {
      enquiries = enquiries.filter(
        (e: any) =>
          e.studentName?.toLowerCase().includes(search) ||
          e.studentEmail?.toLowerCase().includes(search) ||
          e.studentPhoneNumber?.includes(search) ||
          e.courseNameSnapshot?.toLowerCase().includes(search)
      );
    }

    // Sort chronologically descending
    enquiries.sort((a: any, b: any) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });

    return NextResponse.json({ enquiries, metrics });
  } catch (error: any) {
    console.error("Admin enquiries fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
