"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { useToast } from "@/components/ui/toast";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Navbar } from "@/components/navigation/navbar";
import { Footer } from "@/components/navigation/footer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Course, Week, Module, Lesson, Resource, LessonProgress } from "@/types";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  PlayCircle,
  FileCode2,
  Lock,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Download,
  Info,
} from "lucide-react";

function CoursePlayerContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;

  const searchParams = useSearchParams();
  const router = useRouter();
  const initialLessonId = searchParams.get("lesson");

  const { user, isAdmin } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "materials">("overview");
  const [loading, setLoading] = useState(true);
  const [togglingProgress, setTogglingProgress] = useState(false);

  useEffect(() => {
    async function fetchCourseAndVerify() {
      if (!user) return;

      try {
        // 1. Verify student enrollment or admin privilege
        if (!isAdmin) {
          const enrollmentDoc = await getDoc(
            doc(db, "enrollments", `${user.uid}_${courseId}`)
          );
          if (!enrollmentDoc.exists()) {
            setIsAuthorized(false);
            setLoading(false);
            return;
          }
        }
        setIsAuthorized(true);

        // 2. Fetch Course details
        const courseDoc = await getDoc(doc(db, "courses", courseId));
        if (courseDoc.exists()) {
          setCourse({ id: courseDoc.id, ...courseDoc.data() } as Course);
        }

        // 3. Fetch Weeks
        const weeksQ = query(
          collection(db, "weeks"),
          where("courseId", "==", courseId)
        );
        const weeksSnap = await getDocs(weeksQ);
        const wList: Week[] = [];
        weeksSnap.forEach((d) => wList.push({ id: d.id, ...d.data() } as Week));
        wList.sort((a, b) => a.weekNumber - b.weekNumber);
        setWeeks(wList);

        // 4. Fetch Modules
        const modulesQ = query(
          collection(db, "modules"),
          where("courseId", "==", courseId)
        );
        const modulesSnap = await getDocs(modulesQ);
        const mList: Module[] = [];
        modulesSnap.forEach((d) => mList.push({ id: d.id, ...d.data() } as Module));
        mList.sort((a, b) => a.orderIndex - b.orderIndex);
        setModules(mList);

        // 5. Fetch Lessons
        const lessonsQ = query(
          collection(db, "lessons"),
          where("courseId", "==", courseId)
        );
        const lessonsSnap = await getDocs(lessonsQ);
        const lList: Lesson[] = [];
        lessonsSnap.forEach((d) => {
          const lData = { id: d.id, ...d.data() } as Lesson;
          // Filter published lessons for students
          if (lData.isPublished || isAdmin) {
            lList.push(lData);
          }
        });
        lList.sort((a, b) => a.orderIndex - b.orderIndex);
        setLessons(lList);

        // 6. Fetch Resources
        const resQ = query(
          collection(db, "resources"),
          where("courseId", "==", courseId)
        );
        const resSnap = await getDocs(resQ);
        const rList: Resource[] = [];
        resSnap.forEach((d) => rList.push({ id: d.id, ...d.data() } as Resource));
        rList.sort((a, b) => a.orderIndex - b.orderIndex);
        setResources(rList);

        // 7. Fetch User Progress
        const progQ = query(
          collection(db, "lessonProgress"),
          where("userId", "==", user.uid),
          where("courseId", "==", courseId)
        );
        const progSnap = await getDocs(progQ);
        const pMap: Record<string, boolean> = {};
        progSnap.forEach((d) => {
          const p = d.data() as LessonProgress;
          if (p.completed) pMap[p.lessonId] = true;
        });
        setProgressMap(pMap);

        // 8. Select initial lesson
        if (lList.length > 0) {
          if (initialLessonId) {
            const found = lList.find((l) => l.id === initialLessonId);
            setActiveLesson(found || lList[0]);
          } else {
            // Pick first incomplete lesson, or first lesson
            const firstIncomplete = lList.find((l) => !pMap[l.id]);
            setActiveLesson(firstIncomplete || lList[0]);
          }
        }
      } catch (err) {
        console.error("Error loading classroom:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCourseAndVerify();
  }, [user, courseId, isAdmin, initialLessonId]);

  // Toggle completion
  const handleToggleComplete = async () => {
    if (!user || !activeLesson) return;
    const currentStatus = Boolean(progressMap[activeLesson.id]);
    const nextStatus = !currentStatus;

    setTogglingProgress(true);
    try {
      const token = await user.getIdToken(true);
      const res = await fetch("/api/progress/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lessonId: activeLesson.id,
          courseId,
          completed: nextStatus,
        }),
      });

      if (!res.ok) {
        // Direct Firestore fallback
        const progressId = `${user.uid}_${activeLesson.id}`;
        await setDoc(doc(db, "lessonProgress", progressId), {
          userId: user.uid,
          courseId,
          lessonId: activeLesson.id,
          completed: nextStatus,
          updatedAt: serverTimestamp(),
        });
      }

      setProgressMap((prev) => ({
        ...prev,
        [activeLesson.id]: nextStatus,
      }));

      if (nextStatus) {
        toastSuccess("Lesson Completed!", `Recorded completion for "${activeLesson.title}".`);
      }
    } catch (err: any) {
      try {
        // Direct Firestore fallback
        const progressId = `${user.uid}_${activeLesson.id}`;
        await setDoc(doc(db, "lessonProgress", progressId), {
          userId: user.uid,
          courseId,
          lessonId: activeLesson.id,
          completed: nextStatus,
          updatedAt: serverTimestamp(),
        });

        setProgressMap((prev) => ({
          ...prev,
          [activeLesson.id]: nextStatus,
        }));

        if (nextStatus) {
          toastSuccess("Lesson Completed!", `Recorded completion for "${activeLesson.title}".`);
        }
      } catch (fallbackErr: any) {
        toastError("Error", fallbackErr.message || err.message);
      }
    } finally {
      setTogglingProgress(false);
    }
  };

  // Lesson navigation
  const currentIndex = activeLesson
    ? lessons.findIndex((l) => l.id === activeLesson.id)
    : -1;
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex !== -1 && currentIndex < lessons.length - 1
      ? lessons[currentIndex + 1]
      : null;

  const navigateToLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    router.replace(`/courses/${courseId}?lesson=${lesson.id}`, { scroll: false });
  };

  // Filter resources associated with current week or current lesson
  const currentWeekResources = activeLesson
    ? resources.filter(
        (r) =>
          r.weekId === activeLesson.weekId ||
          (r.lessonId && r.lessonId === activeLesson.id)
      )
    : resources;

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#071527] dark:text-slate-100 transition-colors">
          <Navbar />
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <Loader2 className="h-8 w-8 text-teal-500 dark:text-teal-400 animate-spin mb-3" />
            <p className="text-sm text-slate-600 dark:text-slate-300">Loading classroom...</p>
          </div>
          <Footer />
        </div>
      </AuthGuard>
    );
  }

  // Unauthorized view
  if (isAuthorized === false) {
    return (
      <AuthGuard>
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#071527] dark:text-slate-100 transition-colors">
          <Navbar />
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-amber-500/40 rounded-2xl p-8 text-center space-y-4 shadow-xl">
              <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400">
                <Lock className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Enrollment Required</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                You do not have an active enrollment code assigned to this course.
                Enter your enrollment key to unlock full classroom access.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <Link href="/redeem" className="w-full">
                  <Button className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold">
                    Redeem Enrollment Code
                  </Button>
                </Link>
                <Link href="/dashboard" className="w-full">
                  <Button variant="outline" className="w-full border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#071527] dark:text-slate-100 transition-colors">
        <Navbar />

        {/* Classroom Header Bar */}
        <div className="border-b border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/50 py-3 px-4 sm:px-6 lg:px-8 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                    {course?.name}
                  </h1>
                  <Badge variant="outline" className="text-[10px] text-teal-600 dark:text-teal-400 border-teal-500/30">
                    {course?.batchName || "Batch 2026"}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Instructor: {course?.instructorName || "Arul Benjamin · TiBen AI Academy"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>
                Completed:{" "}
                <strong className="text-teal-600 dark:text-teal-400">
                  {Object.values(progressMap).filter(Boolean).length} / {lessons.length}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Main Classroom Layout */}
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left / Main Video & Lesson Content */}
            <div className="lg:col-span-2 space-y-6">
              {activeLesson ? (
                <>
                  {/* YouTube IFrame Player */}
                  <div className="rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800 bg-black shadow-2xl">
                    <div className="video-container">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${activeLesson.youtubeVideoId}?rel=0&modestbranding=1&enablejsapi=1`}
                        title={activeLesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>

                  {/* Lesson Controls & Header */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                          {activeLesson.title}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Estimated Duration: {activeLesson.duration} minutes
                        </p>
                      </div>

                      {/* Mark Complete Action */}
                      <Button
                        onClick={handleToggleComplete}
                        disabled={togglingProgress}
                        className={`font-bold text-xs gap-1.5 shrink-0 ${
                          progressMap[activeLesson.id]
                            ? "bg-emerald-500 hover:bg-emerald-600 text-slate-950"
                            : "bg-teal-500 hover:bg-teal-600 text-slate-950"
                        }`}
                      >
                        {progressMap[activeLesson.id] ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Completed
                          </>
                        ) : (
                          <>
                            <Circle className="h-4 w-4" />
                            Mark as Complete
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Navigation Buttons: Prev / Next */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      {prevLesson ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigateToLesson(prevLesson)}
                          className="text-xs text-slate-300 hover:text-white gap-1.5"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous Lesson
                        </Button>
                      ) : (
                        <div />
                      )}

                      {nextLesson && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigateToLesson(nextLesson)}
                          className="text-xs text-teal-400 hover:text-teal-300 font-semibold gap-1.5"
                        >
                          Next Lesson
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Tabs: Lesson Overview vs Google Drive Resources */}
                  <div className="space-y-4 pt-2">
                    <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-medium">
                      <button
                        onClick={() => setActiveTab("overview")}
                        className={`pb-2.5 px-3 border-b-2 transition-colors ${
                          activeTab === "overview"
                            ? "border-teal-500 text-teal-600 dark:border-teal-400 dark:text-teal-300 font-bold"
                            : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                        }`}
                      >
                        Lesson Summary
                      </button>
                      <button
                        onClick={() => setActiveTab("materials")}
                        className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                          activeTab === "materials"
                            ? "border-teal-500 text-teal-600 dark:border-teal-400 dark:text-teal-300 font-bold"
                            : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                        }`}
                      >
                        <FileCode2 className="h-3.5 w-3.5" />
                        Learning Materials ({currentWeekResources.length})
                      </button>
                    </div>

                    {activeTab === "overview" ? (
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 space-y-3 shadow-sm">
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                          {activeLesson.description ||
                            "This session recording covers key architectural concepts, practical demonstrations, and pipeline configurations."}
                        </p>

                        <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
                          <Info className="h-4 w-4 text-teal-500 dark:text-teal-400 shrink-0 mt-0.5" />
                          <span>
                            Private YouTube playback is governed by cohort access rights. If playback stalls, ensure you are not using ad-blockers that prevent IFrame API initialization.
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentWeekResources.length === 0 ? (
                          <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                            No external materials attached to this week yet.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {currentWeekResources.map((res) => (
                              <div
                                key={res.id}
                                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-teal-500/40 dark:hover:border-slate-700 transition-colors flex flex-col justify-between gap-3 shadow-sm"
                              >
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <FileCode2 className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
                                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                      {res.title}
                                    </h4>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                                  >
                                    {res.fileType}
                                  </Badge>
                                </div>

                                <a
                                  href={res.driveUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full"
                                >
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full border-slate-300 dark:border-slate-700 text-xs text-teal-600 dark:text-teal-300 hover:bg-slate-100 dark:hover:bg-slate-800 gap-1.5"
                                  >
                                    <span>Open on Google Drive</span>
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-3">
                  <PlayCircle className="h-10 w-10 text-slate-400 dark:text-slate-600 mx-auto" />
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">No Lessons Available</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    The instructor has not published any lesson recordings for this course yet.
                  </p>
                </div>
              )}
            </div>

            {/* Right: Course Curriculum Hierarchy Sidebar */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-md">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Course Curriculum</h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {lessons.length} Lessons
                  </span>
                </div>

                <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                  {weeks.map((week) => {
                    const weekModules = modules.filter((m) => m.weekId === week.id);

                    return (
                      <div key={week.id} className="space-y-2">
                        <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <span className="text-teal-400">W{week.weekNumber}:</span>
                          <span>{week.title}</span>
                        </div>

                        <div className="space-y-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                          {weekModules.map((module) => {
                            const moduleLessons = lessons.filter(
                              (l) => l.moduleId === module.id
                            );

                            return (
                              <div key={module.id} className="space-y-1">
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block px-2">
                                  {module.title}
                                </span>

                                <div className="space-y-1">
                                  {moduleLessons.map((lesson) => {
                                    const isCurrent = activeLesson?.id === lesson.id;
                                    const isDone = Boolean(progressMap[lesson.id]);

                                    return (
                                      <button
                                        key={lesson.id}
                                        onClick={() => navigateToLesson(lesson)}
                                        className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors ${
                                          isCurrent
                                            ? "bg-teal-500/15 border border-teal-500/40 text-teal-700 dark:text-teal-200 font-semibold"
                                            : "hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          {isDone ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                                          ) : (
                                            <Circle className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
                                          )}
                                          <span className="truncate">
                                            {lesson.title}
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                                          {lesson.duration}m
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </AuthGuard>
  );
}

export default function CoursePlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
          <Loader2 className="h-8 w-8 text-teal-400 animate-spin mb-2" />
          <p className="text-xs text-slate-400">Loading classroom...</p>
        </div>
      }
    >
      <CoursePlayerContent params={params} />
    </Suspense>
  );
}
