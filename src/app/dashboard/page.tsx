"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth-context";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Navbar } from "@/components/navigation/navbar";
import { Footer } from "@/components/navigation/footer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Enrollment, Course, Lesson, LessonProgress } from "@/types";
import {
  BookOpen,
  PlayCircle,
  CheckCircle2,
  KeyRound,
  ArrowRight,
  Sparkles,
  Calendar,
  Layers,
  GraduationCap,
  Clock,
} from "lucide-react";

export default function StudentDashboardPage() {
  const { user, userProfile, isAdmin } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Record<string, Course>>({});
  const [courseLessons, setCourseLessons] = useState<Record<string, Lesson[]>>({});
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

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

    fetchDashboardData();
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
                Track your data engineering milestones, lectures, and hands-on lab resources.
              </p>
            </div>

            <div className="flex items-center gap-2">
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

          {/* Learning Progress Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-slate-800 bg-slate-900/80">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    Enrolled Courses
                  </span>
                  <BookOpen className="h-4 w-4 text-teal-400" />
                </div>
                <div className="text-2xl font-bold text-white mt-2">
                  {loading ? "..." : enrollments.length}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Authorized cohorts</p>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/80">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    Lessons Completed
                  </span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-white mt-2">
                  {loading ? "..." : `${totalCompletedLessons} / ${totalLessonsEnrolled}`}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Recorded video milestones
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/80">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    Curriculum Progress
                  </span>
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold text-white mt-2">
                  {loading ? "..." : `${overallPercent}%`}
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                  <div
                    className="bg-teal-400 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${overallPercent}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enrolled Courses Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white tracking-tight">
                My Enrolled Courses
              </h2>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-44 rounded-xl bg-slate-800 animate-pulse" />
                <div className="h-44 rounded-xl bg-slate-800 animate-pulse" />
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
      </div>
    </AuthGuard>
  );
}

