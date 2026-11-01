import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import * as XLSX from "xlsx";

/**
 * Sanitizes cell values to prevent Spreadsheet Formula Injection (CSV/Excel Injection).
 * If a string begins with =, +, -, @, \t, or \r, prepend a single quote.
 */
function sanitizeForSpreadsheet(val: any): any {
  if (val === null || val === undefined) return "";
  if (typeof val !== "string") return val;
  const trimmed = val.trim();
  if (
    trimmed.startsWith("=") ||
    trimmed.startsWith("+") ||
    trimmed.startsWith("-") ||
    trimmed.startsWith("@") ||
    trimmed.startsWith("\t") ||
    trimmed.startsWith("\r")
  ) {
    return `'${trimmed}`;
  }
  return trimmed;
}

/**
 * GET /api/admin/export/registrations
 * Generates and downloads a formatted .xlsx workbook of student registrations.
 * Strictly restricted to authenticated administrators.
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const courseFilter = searchParams.get("courseId");
    const mobileFilter = searchParams.get("hasMobile"); // "true" | "false"
    const enrollmentFilter = searchParams.get("enrollmentStatus"); // "enrolled" | "unenrolled"
    const searchQuery = searchParams.get("search")?.toLowerCase().trim();
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const adminDb = getAdminDb();

    // 1. Fetch users, enrollments, and courses in parallel
    const [usersSnap, enrollmentsSnap, coursesSnap] = await Promise.all([
      adminDb.collection("users").get(),
      adminDb.collection("enrollments").get(),
      adminDb.collection("courses").get(),
    ]);

    const courseNameMap: Record<string, string> = {};
    coursesSnap.docs.forEach((d) => {
      courseNameMap[d.id] = d.data().name || "Cohort Course";
    });

    const userEnrollmentsMap: Record<string, any[]> = {};
    enrollmentsSnap.docs.forEach((d) => {
      const data = d.data();
      if (!userEnrollmentsMap[data.userId]) {
        userEnrollmentsMap[data.userId] = [];
      }
      userEnrollmentsMap[data.userId].push({
        id: d.id,
        courseId: data.courseId,
        courseName: courseNameMap[data.courseId] || "Course",
        batchName: data.batchName || "Batch",
        status: data.status || "active",
        enrolledAt: data.enrolledAt,
      });
    });

    // 2. Build and filter row records
    let records = usersSnap.docs.map((doc) => {
      const data = doc.data();
      const userEnrollments = userEnrollmentsMap[doc.id] || [];
      const hasEnrollments = userEnrollments.length > 0;
      const hasPhone = Boolean(data.phoneNumber && data.phoneNumber.trim().length > 0);

      // Extract registration date
      let regDateStr = "N/A";
      let regTimestamp = 0;
      if (data.createdAt) {
        if (typeof data.createdAt.toDate === "function") {
          const d = data.createdAt.toDate();
          regDateStr = d.toISOString().replace("T", " ").substring(0, 19);
          regTimestamp = d.getTime();
        } else if (data.createdAt._seconds) {
          const d = new Date(data.createdAt._seconds * 1000);
          regDateStr = d.toISOString().replace("T", " ").substring(0, 19);
          regTimestamp = d.getTime();
        }
      }

      // Course names enrolled
      const enrolledCoursesStr = hasEnrollments
        ? userEnrollments.map((e) => e.courseName).join(", ")
        : data.selectedCourseId && courseNameMap[data.selectedCourseId]
        ? `${courseNameMap[data.selectedCourseId]} (Interest)`
        : "None";

      return {
        uid: doc.id,
        displayName: data.displayName || "Student",
        email: data.email || "",
        phoneNumber: data.phoneNumber || "",
        countryCode: data.countryCode || "+91",
        hasPhone,
        hasEnrollments,
        userEnrollments,
        enrolledCoursesStr,
        selectedCourseId: data.selectedCourseId || "",
        regDateStr,
        regTimestamp,
        role: data.role || "student",
        status: data.status || "active",
      };
    });

    // Apply Filters
    if (searchQuery) {
      records = records.filter(
        (r) =>
          r.displayName.toLowerCase().includes(searchQuery) ||
          r.email.toLowerCase().includes(searchQuery) ||
          r.phoneNumber.includes(searchQuery) ||
          r.uid.toLowerCase().includes(searchQuery)
      );
    }

    if (courseFilter) {
      records = records.filter(
        (r) =>
          r.selectedCourseId === courseFilter ||
          r.userEnrollments.some((e) => e.courseId === courseFilter)
      );
    }

    if (mobileFilter === "true") {
      records = records.filter((r) => r.hasPhone);
    } else if (mobileFilter === "false") {
      records = records.filter((r) => !r.hasPhone);
    }

    if (enrollmentFilter === "enrolled") {
      records = records.filter((r) => r.hasEnrollments);
    } else if (enrollmentFilter === "unenrolled") {
      records = records.filter((r) => !r.hasEnrollments);
    }

    if (startDate) {
      const startMs = new Date(startDate).getTime();
      records = records.filter((r) => r.regTimestamp >= startMs);
    }
    if (endDate) {
      const endMs = new Date(endDate).getTime() + 86400000; // end of day
      records = records.filter((r) => r.regTimestamp <= endMs);
    }

    // Sort by registration date descending
    records.sort((a, b) => b.regTimestamp - a.regTimestamp);

    // 3. Format rows for Excel sheet
    const excelRows = records.map((r, index) => {
      const isComplete = r.hasPhone;
      return {
        "S.No": index + 1,
        "Registration ID": sanitizeForSpreadsheet(r.uid),
        "Full Name": sanitizeForSpreadsheet(r.displayName),
        "Email Address": sanitizeForSpreadsheet(r.email),
        "Mobile Number": sanitizeForSpreadsheet(
          r.phoneNumber ? r.phoneNumber : "Not Provided"
        ),
        "Selected / Enrolled Course": sanitizeForSpreadsheet(r.enrolledCoursesStr),
        "Registration Date & Time": sanitizeForSpreadsheet(r.regDateStr),
        "Enrollment Status": r.hasEnrollments ? "Active Student" : "Registered (Pending Activation)",
        "Course Access Status": r.hasEnrollments
          ? `Unlocked (${r.userEnrollments.length} Course${r.userEnrollments.length > 1 ? "s" : ""})`
          : "No Courses Unlocked",
        "Profile Completion Status": isComplete ? "Completed" : "Incomplete (Missing Mobile)",
        "Mobile Verification Status": isComplete
          ? "Format Validated (E.164)"
          : "Unverified / Missing",
      };
    });

    // 4. Create Workbook using XLSX
    const worksheet = XLSX.utils.json_to_sheet(excelRows);

    // Auto-fit column widths
    const colWidths = [
      { wch: 6 },  // S.No
      { wch: 32 }, // Registration ID
      { wch: 24 }, // Full Name
      { wch: 32 }, // Email Address
      { wch: 18 }, // Mobile Number
      { wch: 36 }, // Selected / Enrolled Course
      { wch: 22 }, // Registration Date & Time
      { wch: 28 }, // Enrollment Status
      { wch: 24 }, // Course Access Status
      { wch: 26 }, // Profile Completion Status
      { wch: 28 }, // Mobile Verification Status
    ];
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

    // Summary metadata sheet
    const summaryData = [
      { Metric: "Total Records Exported", Value: records.length },
      { Metric: "Users With Mobile Number", Value: records.filter((r) => r.hasPhone).length },
      { Metric: "Users Missing Mobile Number", Value: records.filter((r) => !r.hasPhone).length },
      {
        Metric: "Profile Completion Rate",
        Value: records.length > 0
          ? `${Math.round((records.filter((r) => r.hasPhone).length / records.length) * 100)}%`
          : "0%",
      },
      { Metric: "Exported By Admin", Value: sanitizeForSpreadsheet(admin.email || admin.uid) },
      { Metric: "Export Timestamp (UTC)", Value: new Date().toISOString() },
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet["!cols"] = [{ wch: 30 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Audit Summary");

    // Write binary buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Format current date for filename
    const dateStr = new Date().toISOString().substring(0, 10);
    const filename = `TibenAI_Registrations_${dateStr}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: any) {
    console.error("Excel export error:", error);
    return NextResponse.json(
      { error: "Internal server error generating Excel export" },
      { status: 500 }
    );
  }
}

