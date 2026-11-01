"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth-context";
import { useToast } from "@/components/ui/toast";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BookOpen,
  Video,
  KeyRound,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  ShieldCheck,
  FileSpreadsheet,
  Phone,
  PhoneOff,
  Copy,
  ExternalLink,
  Sparkles,
  Loader2,
} from "lucide-react";

interface Metrics {
  totalStudents: number;
  activeEnrollments: number;
  totalCourses: number;
  totalLessons: number;
  totalCompletions: number;
  totalLiveClasses: number;
  usersWithPhone: number;
  usersMissingPhone: number;
  profileCompletionRate: number;
}

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [metrics, setMetrics] = useState<Metrics>({
    totalStudents: 0,
    activeEnrollments: 0,
    totalCourses: 0,
    totalLessons: 0,
    totalCompletions: 0,
    totalLiveClasses: 0,
    usersWithPhone: 0,
    usersMissingPhone: 0,
    profileCompletionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function fetchMetrics() {
      if (!user) return;
      try {
        // Priority 1: Fetch via authenticated server API route
        const token = await user.getIdToken();
        const res = await fetch("/api/admin/metrics", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setMetrics({
            totalStudents: data.totalStudents ?? 0,
            activeEnrollments: data.activeEnrollments ?? 0,
            totalCourses: data.totalCourses ?? 0,
            totalLessons: data.totalLessons ?? 0,
            totalCompletions: data.totalCompletions ?? 0,
            totalLiveClasses: data.totalLiveClasses ?? 0,
            usersWithPhone: data.usersWithPhone ?? 0,
            usersMissingPhone: data.usersMissingPhone ?? 0,
            profileCompletionRate: data.profileCompletionRate ?? 0,
          });
          setLoading(false);
          return;
        }
      } catch (apiErr) {
        console.warn("API metrics fetch failed, falling back to direct Firestore:", apiErr);
      }

      // Priority 2: Direct client-side Firestore fallback using Promise.allSettled
      try {
        const results = await Promise.allSettled([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "enrollments")),
          getDocs(collection(db, "courses")),
          getDocs(collection(db, "lessons")),
          getDocs(collection(db, "liveClasses")),
        ]);

        const usersSnap = results[0].status === "fulfilled" ? results[0].value : null;
        const enrollSnap = results[1].status === "fulfilled" ? results[1].value : null;
        const coursesSnap = results[2].status === "fulfilled" ? results[2].value : null;
        const lessonsSnap = results[3].status === "fulfilled" ? results[3].value : null;
        const liveSnap = results[4].status === "fulfilled" ? results[4].value : null;

        let withPhone = 0;
        let missingPhone = 0;

        if (usersSnap) {
          usersSnap.docs.forEach((d) => {
            const data = d.data();
            if (data.phoneNumber && data.phoneNumber.trim().length > 0) {
              withPhone++;
            } else {
              missingPhone++;
            }
          });
        }

        const totalStudents = usersSnap ? usersSnap.size : 0;
        const completionRate =
          totalStudents > 0 ? Math.round((withPhone / totalStudents) * 100) : 0;

        setMetrics((prev) => ({
          totalStudents: totalStudents || prev.totalStudents,
          activeEnrollments: enrollSnap ? enrollSnap.size : prev.activeEnrollments,
          totalCourses: coursesSnap ? coursesSnap.size : prev.totalCourses,
          totalLessons: lessonsSnap ? lessonsSnap.size : prev.totalLessons,
          totalCompletions: prev.totalCompletions,
          totalLiveClasses: liveSnap ? liveSnap.size : prev.totalLiveClasses,
          usersWithPhone: withPhone || prev.usersWithPhone,
          usersMissingPhone: missingPhone || prev.usersMissingPhone,
          profileCompletionRate: completionRate || prev.profileCompletionRate,
        }));
      } catch (err) {
        console.error("Error in fallback metrics:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, [user]);

  const handleExportExcel = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/export/registrations", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate Excel report");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const today = new Date().toISOString().substring(0, 10);
      a.download = `TibenAI_Registrations_${today}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toastSuccess(
        "Excel Export Complete",
        "Student registration workbook downloaded successfully."
      );
    } catch (err: any) {
      console.error("Export error:", err);
      try {
        const XLSX = await import("xlsx");
        const [usersSnap, enrollSnap, coursesSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "enrollments")),
          getDocs(collection(db, "courses")),
        ]);

        const courseNameMap: Record<string, string> = {};
        coursesSnap.docs.forEach((d) => {
          courseNameMap[d.id] = d.data().name || "Cohort Course";
        });

        const userEnrollmentsMap: Record<string, any[]> = {};
        enrollSnap.docs.forEach((d) => {
          const data = d.data();
          if (!userEnrollmentsMap[data.userId]) userEnrollmentsMap[data.userId] = [];
          userEnrollmentsMap[data.userId].push(data);
        });

        const excelRows = usersSnap.docs.map((docSnap, index) => {
          const s = docSnap.data();
          const uEnrollments = userEnrollmentsMap[docSnap.id] || [];
          const hasEnrollments = uEnrollments.length > 0;
          const enrolledCoursesStr = hasEnrollments
            ? uEnrollments.map((e: any) => courseNameMap[e.courseId] || e.courseId).join(", ")
            : s.selectedCourseId
            ? courseNameMap[s.selectedCourseId] || "Interest"
            : "None";

          let regDateStr = "N/A";
          if (s.createdAt) {
            if (typeof s.createdAt.toDate === "function") {
              regDateStr = s.createdAt.toDate().toLocaleString();
            } else if (s.createdAt.seconds) {
              regDateStr = new Date(s.createdAt.seconds * 1000).toLocaleString();
            }
          }

          return {
            "S.No": index + 1,
            "Registration ID": docSnap.id,
            "Full Name": s.displayName || "Student",
            "Email Address": s.email || "",
            "Mobile Number": s.phoneNumber || "Not Provided",
            "Selected / Enrolled Course": enrolledCoursesStr,
            "Registration Date": regDateStr,
            "Enrollment Status": hasEnrollments ? "Active Student" : "Registered (Pending Activation)",
            "Course Access Status": hasEnrollments
              ? `Unlocked (${uEnrollments.length} Course${uEnrollments.length > 1 ? "s" : ""})`
              : "No Courses Unlocked",
            "Profile Completion Status": s.phoneNumber ? "Completed" : "Incomplete (Missing Mobile)",
          };
        });

        const worksheet = XLSX.utils.json_to_sheet(excelRows);
        worksheet["!cols"] = [
          { wch: 6 },
          { wch: 32 },
          { wch: 24 },
          { wch: 30 },
          { wch: 18 },
          { wch: 34 },
          { wch: 22 },
          { wch: 28 },
          { wch: 24 },
          { wch: 26 },
        ];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");
        const today = new Date().toISOString().substring(0, 10);
        XLSX.writeFile(workbook, `TibenAI_Registrations_${today}.xlsx`);

        toastSuccess(
          "Excel Export Complete",
          "Student registration workbook downloaded successfully."
        );
      } catch (fallbackErr: any) {
        console.error("Client fallback export error:", fallbackErr);
        toastError("Export Failed", err.message || "Could not export registrations");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toastSuccess("Copied!", `${label} copied to clipboard.`);
  };

  const cards = [
    {
      title: "Registered Students",
      value: metrics.totalStudents,
      description: "Authenticated accounts",
      icon: Users,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Active Enrollments",
      value: metrics.activeEnrollments,
      description: "Course seats unlocked",
      icon: CheckCircle2,
      color: "text-teal-400",
      bgColor: "bg-teal-500/10 border-teal-500/20",
    },
    {
      title: "Live Class Sessions",
      value: metrics.totalLiveClasses,
      description: "Scheduled interactive meets",
      icon: Video,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10 border-cyan-500/20",
    },
    {
      title: "Profile Completion",
      value: `${metrics.profileCompletionRate}%`,
      description: `${metrics.usersWithPhone} / ${metrics.totalStudents} with mobile`,
      icon: Phone,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Administrator Dashboard
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Real-time platform metrics, course operations, and student management.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={handleExportExcel}
            disabled={isExporting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 text-xs shadow-sm"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            <span>Export to Excel</span>
          </Button>
          <Link href="/admin/live-classes">
            <Button size="sm" className="bg-[#0D9488] hover:bg-[#0f766e] text-white font-bold gap-1.5 text-xs shadow-sm">
              <Video className="h-4 w-4" />
              Live Classes
            </Button>
          </Link>
          <Link href="/admin/courses">
            <Button size="sm" variant="outline" className="border-slate-300 dark:border-slate-700 text-xs gap-1.5 text-slate-700 dark:text-slate-300">
              <PlusCircle className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              New Course
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <Card key={i} className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg border ${card.bgColor} ${card.color}`}>
                <card.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {loading ? "..." : card.value}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Profile Completion Overview Panel */}
      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 shadow-md overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base text-slate-900 dark:text-white">
                  Student Profile Completion Overview
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Audit mobile number availability across all registered and Google Sign-In accounts
                </CardDescription>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleExportExcel}
              disabled={isExporting}
              className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-xs gap-1.5 shrink-0"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Download Excel (.xlsx)</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <span className="text-xs text-slate-500 font-medium">Total Registered Users</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {metrics.totalStudents}
              </div>
              <span className="text-[11px] text-slate-400">All authentication methods</span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/30">
              <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                With Mobile Number
              </span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {metrics.usersWithPhone}
              </div>
              <span className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70">
                Validated contact on file
              </span>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-500/30">
              <span className="text-xs text-amber-700 dark:text-amber-300 font-medium flex items-center justify-center gap-1">
                <PhoneOff className="h-3.5 w-3.5" />
                Missing Mobile Number
              </span>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {metrics.usersMissingPhone}
              </div>
              <span className="text-[11px] text-amber-600/70 dark:text-amber-400/70">
                Prompted via dashboard banner
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Overall Profile Completion</span>
              <span className="font-bold text-teal-600 dark:text-teal-400">
                {metrics.profileCompletionRate}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${metrics.profileCompletionRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Action Modules Hub */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 hover:border-teal-500/40 transition-colors shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <Video className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm text-slate-900 dark:text-white">Live Classes</CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Add Google Meet, Teams, or Zoom links and approve participant seats.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/admin/live-classes">
              <Button variant="outline" size="sm" className="w-full text-xs justify-between">
                <span>Manage Live Meets</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 hover:border-blue-500/40 transition-colors shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Users className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm text-slate-900 dark:text-white">Student Roster</CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Filter by mobile availability, export to Excel, and manage roles.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/admin/students">
              <Button variant="outline" size="sm" className="w-full text-xs justify-between">
                <span>View Students</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 hover:border-cyan-500/40 transition-colors shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <BookOpen className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm text-slate-900 dark:text-white">Courses &amp; Labs</CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Structure weekly modules, lectures, and Google Drive materials.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/admin/courses">
              <Button variant="outline" size="sm" className="w-full text-xs justify-between">
                <span>Manage Courses</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 hover:border-purple-500/40 transition-colors shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <KeyRound className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm text-slate-900 dark:text-white">Access Keys</CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Generate format-friendly cohort redemption codes for students.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/admin/enrollment-codes">
              <Button variant="outline" size="sm" className="w-full text-xs justify-between">
                <span>Manage Codes</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* ─── Social Media Admin Panel ─────────────────────────────────────────── */}
      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <CardTitle className="text-base text-slate-900 dark:text-white">
              Tiben AI Academy — Social Media
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Official social channels, profile handles, and fast copy shortcuts for student admissions
          </CardDescription>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Instagram Box */}
          <div className="p-4 rounded-xl border border-pink-500/20 bg-gradient-to-r from-pink-500/5 via-rose-500/5 to-transparent dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Instagram</h4>
                  <span className="text-xs text-pink-600 dark:text-pink-400 font-mono font-medium">
                    @tibenaiacademy
                  </span>
                </div>
              </div>

              <a
                href="https://www.instagram.com/tibenaiacademy/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="sm"
                  className="h-8 text-xs bg-pink-600 hover:bg-pink-700 text-white gap-1.5"
                >
                  <span>Visit Instagram</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Official Instagram page for AI updates, video shorts, and live batch announcements.
            </p>

            <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200 dark:border-slate-700/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  copyToClipboard("https://www.instagram.com/tibenaiacademy/", "Instagram URL")
                }
                className="h-7 text-[11px] gap-1 text-slate-700 dark:text-slate-300"
              >
                <Copy className="h-3 w-3" />
                <span>Copy URL</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard("@tibenaiacademy", "Instagram Handle")}
                className="h-7 text-[11px] gap-1 text-slate-700 dark:text-slate-300"
              >
                <Copy className="h-3 w-3" />
                <span>Copy Handle</span>
              </Button>
            </div>
          </div>

          {/* LinkedIn Box */}
          <div className="p-4 rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-500/5 via-sky-500/5 to-transparent dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-[#0A66C2] flex items-center justify-center text-white shadow-sm">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">LinkedIn</h4>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    Tiben AI Academy
                  </span>
                </div>
              </div>

              <a
                href="https://www.linkedin.com/company/tiben-ai-academy/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="sm"
                  className="h-8 text-xs bg-[#0A66C2] hover:bg-[#084e96] text-white gap-1.5"
                >
                  <span>Visit LinkedIn</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Official LinkedIn company presence for career opportunities, enterprise engineering, and certificates.
            </p>

            <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200 dark:border-slate-700/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  copyToClipboard("https://www.linkedin.com/company/tiben-ai-academy/", "LinkedIn URL")
                }
                className="h-7 text-[11px] gap-1 text-slate-700 dark:text-slate-300"
              >
                <Copy className="h-3 w-3" />
                <span>Copy URL</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard("Tiben AI Academy", "LinkedIn Page Name")}
                className="h-7 text-[11px] gap-1 text-slate-700 dark:text-slate-300"
              >
                <Copy className="h-3 w-3" />
                <span>Copy Page Name</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
