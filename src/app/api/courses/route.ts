import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection("courses")
      .where("isPublished", "==", true)
      .get();

    const courses = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        coverImageUrl: data.coverImageUrl || "",
        instructorName: data.instructorName || "Arul Benjamin",
        batchName: data.batchName || "Batch 2026",
        startDate: data.startDate,
        endDate: data.endDate,
        isPublished: data.isPublished,
        actualPrice: typeof data.actualPrice === "number" ? data.actualPrice : 15000,
        currentPrice: typeof data.currentPrice === "number" ? data.currentPrice : 7999,
        currency: data.currency || "INR",
        pricingEnabled: data.pricingEnabled !== false, // default true
        discountPercentage:
          typeof data.discountPercentage === "number"
            ? data.discountPercentage
            : 0,
        // Security requirement: Only expose brochureUrl if brochureEnabled is true
        brochureEnabled: Boolean(data.brochureEnabled),
        brochureUrl: data.brochureEnabled ? (data.brochureUrl || "") : "",
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    });

    return NextResponse.json({ courses });
  } catch (error: any) {
    console.error("Error fetching published courses:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

