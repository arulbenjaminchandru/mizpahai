"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth-context";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Navbar } from "@/components/navigation/navbar";
import { Footer } from "@/components/navigation/footer";
import { UpdateMobileModal } from "@/components/profile/UpdateMobileModal";
import { useToast } from "@/components/ui/toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Enrollment, Course, Lesson, LessonProgress, LiveClass } from "@/types";
import {
  BookOpen,
  PlayCircle,
  CheckCircle2,
  KeyRound,
  ArrowRight,
  Sparkles,
  Calendar,
  Clock,
  Video,
  ExternalLink,
  ShieldCheck,
  Phone,
  PhoneCall,
  User as UserIcon,
  AlertCircle,
  Layers,
  GraduationCap,
  Copy,
} from "lucide-react";

export default function StudentDashboardPage() {
  const { user, userProfile } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Record<string, Course>>({});
  const [courseLessons, setCourseLessons] = useState<Record<string, Lesson[]>>({});
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [unapprovedCourses, setUnapprovedCourses] = useState<{ courseId: string; courseName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLiveClasses, setLoadingLiveClasses] = useState(true);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const { success: toastSuccess } = useToast();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toastSuccess("Copied!", `${label} copied to clipboard`);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toastSuccess("Copied!", `${label} copied to clipboard`);
    }
  };

  // Check if mobile number is missing
  const isMobileMissing =
    !userProfile?.phoneNumber || userProfile.phoneNumber.trim().length === 0;

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;

      try {
        // 1. Fetch user's enrollments
        const enrollmentsQ = query(
          collection(db, "enrollments"),
          where("userId", "==", user.uid)
        );
        const enrSnap = await getDocs(enrollmentsQ);
        const userEnrollments: Enrollment[] = [];
        enrSnap.forEach((d) => userEnrollments.push({ id: d.id, ...d.data() } as Enrollment));
        setEnrollments(userEnrollments);

        // 2. Fetch all courses
        const coursesSnap = await getDocs(collection(db, "courses"));
        const cMap: Record<string, Course> = {};
        coursesSnap.forEach((d) => {
          cMap[d.id] = { id: d.id, ...d.data() } as Course;
        });
        setCourses(cMap);

        // 3. Fetch lessons for enrolled courses
        const lessonsSnap = await getDocs(collection(db, "lessons"));
        const lMap: Record<string, Lesson[]> = {};
        lessonsSnap.forEach((d) => {
          const l = { id: d.id, ...d.data() } as Lesson;
          if (!lMap[l.courseId]) lMap[l.courseId] = [];
          lMap[l.courseId].push(l);
        });
        setCourseLessons(lMap);

        // 4. Fetch user's progress records
        const progressQ = query(
          collection(db, "lessonProgress"),
          where("userId", "==", user.uid)
        );
        const progSnap = await getDocs(progressQ);
        const pMap: Record<string, boolean> = {};
        progSnap.forEach((d) => {
          const p = d.data() as LessonProgress;
          if (p.completed) {
            pMap[p.lessonId] = true;
          }
        });
        setProgressMap(pMap);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    async function fetchLiveClasses() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/live-classes", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setLiveClasses(data.classes || []);
          setUnapprovedCourses(data.unapprovedCourses || []);
        }
      } catch (err) {
        console.error("Error loading live classes:", err);
      } finally {
        setLoadingLiveClasses(false);
      }
    }

    fetchDashboardData();
    fetchLiveClasses();
  }, [user]);

  // Compute overall progress stats
  const enrolledCourseIds = enrollments.map((e) => e.courseId);
  let totalLessonsEnrolled = 0;
  let totalCompletedLessons = 0;

  enrolledCourseIds.forEach((cId) => {
    const lessons = courseLessons[cId] || [];
    totalLessonsEnrolled += lessons.length;
    lessons.forEach((l) => {
      if (progressMap[l.id]) totalCompletedLessons += 1;
    });
  });

  const overallPercent =
    totalLessonsEnrolled > 0
      ? Math.round((totalCompletedLessons / totalLessonsEnrolled) * 100)
      : 0;

  // Find next lesson to continue
  let nextLessonToWatch: { lesson: Lesson; course: Course } | null = null;
  for (const cId of enrolledCourseIds) {
    const lessons = courseLessons[cId] || [];
    const course = courses[cId];
    if (course) {
      const pending = lessons.find((l) => !progressMap[l.id]);
      if (pending) {
        nextLessonToWatch = { lesson: pending, course };
        break;
      }
    }
  }

  // Format registration date
  let regDateFormatted = "Active";
  if (userProfile?.createdAt) {
    try {
      if (typeof (userProfile.createdAt as any).toDate === "function") {
        regDateFormatted = (userProfile.createdAt as any).toDate().toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      } else if ((userProfile.createdAt as any)._seconds) {
        regDateFormatted = new Date(
          (userProfile.createdAt as any)._seconds * 1000
        ).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
    } catch {
      regDateFormatted = "Enrolled";
    }
  }

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#071527] dark:text-slate-100 transition-colors">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-teal-600 dark:text-teal-400">
                  Student Portal
                </span>
                <span className="text-slate-400 dark:text-slate-600">•</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">TiBen AI Academy</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                Welcome back,{" "}
                <span className="text-teal-600 dark:text-teal-400">
                  {userProfile?.displayName || user?.displayName || "Engineer"}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Track your data engineering milestones, lectures, live interactive classes, and lab resources.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link href="/redeem">
                <Button
                  size="sm"
                  className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold gap-1.5 text-xs shadow-md shadow-teal-500/20"
                >
                  <KeyRound className="h-4 w-4" />
                  Redeem Code
                </Button>
              </Link>
            </div>
          </div>

          {/* ─── 5.2 PERSISTENT PROFILE COMPLETION BANNER ─────────────────────── */}
          {isMobileMissing && (
            <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent p-5 sm:p-6 shadow-xl shadow-amber-950/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
              <div className="flex items-start gap-3.5 max-w-2xl">
                <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Complete Your Profile
                    </h3>
                    <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-700 dark:text-amber-300 bg-amber-500/10 uppercase">
                      Action Required
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    Your mobile number is missing from your profile. Please update your contact number to receive important course announcements, class updates, and other communications from Tiben AI Academy.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setIsPhoneModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs gap-1.5 shrink-0 shadow-md"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span>Update Mobile Number</span>
              </Button>
            </div>
          )}

          {/* Continue Learning Banner */}
          {nextLessonToWatch && (
            <Card className="border-teal-500/40 bg-gradient-to-r from-teal-500/10 via-slate-50 to-white dark:from-teal-950/40 dark:to-slate-900 shadow-xl overflow-hidden relative">
              <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                      <PlayCircle className="h-3 w-3" />
                      Resume Learning
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {nextLessonToWatch.course.name}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {nextLessonToWatch.lesson.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-1">
                    {nextLessonToWatch.lesson.description ||
                      "Continue where you left off in your cohort curriculum."}
                  </p>
                </div>

                <Link
                  href={`/courses/${nextLessonToWatch.course.id}?lesson=${nextLessonToWatch.lesson.id}`}
                  className="shrink-0"
                >
                  <Button
                    size="lg"
                    className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold gap-2 text-sm"
                  >
                    Watch Lesson
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* ─── 7.4 / 8.4 MY LIVE CLASSES SECTION ───────────────────────────── */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  My Live Classes
                </h2>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-teal-500/30 text-teal-600 dark:text-teal-400">
                Interactive Faculty Meets
              </Badge>
            </div>

            {loadingLiveClasses ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-32 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-32 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </div>
            ) : liveClasses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveClasses.map((cls) => (
                  <Card
                    key={cls.id}
                    className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 hover:border-teal-500/50 transition-all p-5 flex flex-col justify-between shadow-md"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-mono border-teal-500/40 text-teal-600 dark:text-teal-400 bg-teal-500/10"
                        >
                          {cls.meetingPlatform}
                        </Badge>
                        <span className="text-xs text-slate-500 font-medium">
                          {cls.courseName}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {cls.title}
                      </h3>

                      {cls.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {cls.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-teal-500" />
                          {cls.scheduledDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-cyan-500" />
                          {cls.startTime} {cls.endTime ? `- ${cls.endTime}` : ""}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approved Participant
                      </span>

                      <a
                        href={cls.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          size="sm"
                          className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs gap-1.5 shadow-sm"
                        >
                          <Video className="h-3.5 w-3.5" />
                          <span>Join Live Class</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    </div>
                  </Card>
                ))}
              </div>
            ) : unapprovedCourses.length > 0 ? (
              <Card className="border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 p-6 text-center space-y-2">
                <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Live-class access has not yet been enabled for your account.
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  Please contact the academy administrator or mentor Arul Benjamin (+91-9894481283) to verify your seat and approve interactive meeting access.
                </p>
              </Card>
            ) : enrollments.length === 0 ? (
              <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-6 text-center space-y-2">
                <Video className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500">
                  You are not yet enrolled in any live cohorts. Redeem an access code above to join live weekend sessions.
                </p>
              </Card>
            ) : (
              <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-6 text-center space-y-2">
                <Clock className="h-8 w-8 text-teal-500 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  No Upcoming Live Classes Scheduled
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  New weekend cohort schedules and meeting links will appear here ahead of your next live interactive session.
                </p>
              </Card>
            )}
          </section>

          {/* Learning Progress Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Enrolled Courses
                  </span>
                  <BookOpen className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                  {loading ? "..." : enrollments.length}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Authorized cohorts</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Lessons Completed
                  </span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                  {loading ? "..." : `${totalCompletedLessons} / ${totalLessonsEnrolled}`}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Recorded video milestones
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Curriculum Progress
                  </span>
                  <Sparkles className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                  {loading ? "..." : `${overallPercent}%`}
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2">
                  <div
                    className="bg-teal-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${overallPercent}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─── 5.5 MY PROFILE SECTION ───────────────────────────────────────── */}
          <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-md">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <CardTitle className="text-base text-slate-900 dark:text-white">
                    My Profile &amp; Contact Details
                  </CardTitle>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsPhoneModalOpen(true)}
                  className="h-8 text-xs border-teal-500/40 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/20 gap-1.5"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>{userProfile?.phoneNumber ? "Edit Mobile" : "Add Mobile"}</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-500 font-medium">Full Name</span>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">
                    {userProfile?.displayName || user?.displayName || "Learner"}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 font-medium">Email Address</span>
                  <p className="font-mono text-slate-900 dark:text-white truncate">
                    {user?.email}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 font-medium">Mobile Number</span>
                  {userProfile?.phoneNumber ? (
                    <p className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
                      {userProfile.phoneNumber}
                    </p>
                  ) : (
                    <p className="text-amber-600 dark:text-amber-400 font-semibold">
                      Not Provided
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 font-medium">Registration Date</span>
                  <p className="text-slate-700 dark:text-slate-300">
                    {regDateFormatted}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tiben AI Academy — Social Media & Communities */}
          <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base text-slate-900 dark:text-white">
                      Tiben AI Academy — Official Social Communities
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
                      Stay connected with official channels, AI announcements, video shorts, and industry networking
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Instagram Box */}
              <div className="p-4 rounded-xl border border-pink-500/20 bg-gradient-to-r from-pink-500/5 via-rose-500/5 to-transparent dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center text-white shadow-sm">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Instagram</h4>
                      <span className="text-xs text-pink-600 dark:text-pink-400 font-medium">
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
                      className="h-8 text-xs bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white gap-1.5"
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

          {/* Enrolled Courses Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                My Enrolled Courses
              </h2>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-44 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-44 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </div>
            ) : enrollments.length === 0 ? (
              <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50 p-10 text-center space-y-4 shadow-sm">
                <div className="mx-auto w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    You Have No Enrolled Courses
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    To access recordings and materials, enter your enrollment code provided by the TiBen AI Academy administrator.
                  </p>
                </div>
                <Link href="/redeem" className="inline-block pt-2">
                  <Button className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs gap-1.5">
                    <KeyRound className="h-3.5 w-3.5" />
                    Redeem Code Now
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {enrollments.map((enr) => {
                  const course = courses[enr.courseId];
                  const lessons = courseLessons[enr.courseId] || [];
                  const completedCount = lessons.filter(
                    (l) => progressMap[l.id]
                  ).length;
                  const percent =
                    lessons.length > 0
                      ? Math.round((completedCount / lessons.length) * 100)
                      : 0;

                  return (
                    <Card
                      key={enr.id}
                      className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 hover:border-teal-500/50 dark:hover:border-slate-700 transition-all flex flex-col justify-between shadow-md"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] text-teal-600 dark:text-teal-400 border-teal-500/30"
                          >
                            {enr.batchName || course?.batchName || "Batch 2026"}
                          </Badge>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {lessons.length} Lessons
                          </span>
                        </div>
                        <CardTitle className="text-lg text-slate-900 dark:text-white">
                          {course?.name || "Data Horizon Training"}
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                          {course?.description ||
                            "Data engineering, distributed computing, and generative AI curriculum."}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                            <span>Progress</span>
                            <span className="font-semibold text-teal-600 dark:text-teal-300">
                              {percent}% ({completedCount}/{lessons.length})
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                            <div
                              className="bg-teal-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Instructor: {course?.instructorName || "Arul Benjamin"}
                          </span>
                          <Link href={`/courses/${enr.courseId}`}>
                            <Button
                              size="sm"
                              className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs gap-1.5"
                            >
                              Go to Classroom
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        <Footer />

        {/* Mobile Number Update Dialog */}
        <UpdateMobileModal
          isOpen={isPhoneModalOpen}
          onClose={() => setIsPhoneModalOpen(false)}
          initialPhone={userProfile?.phoneNumber}
          initialCountryCode={userProfile?.countryCode || "+91"}
        />
      </div>
    </AuthGuard>
  );
}
