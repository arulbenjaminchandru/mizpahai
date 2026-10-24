"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth-context";
import { useToast } from "@/components/ui/toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { extractYouTubeVideoId, validateDriveUrl } from "@/lib/validations";
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Course, Week, Module, Lesson, Resource } from "@/types";
import {
  ArrowLeft,
  Plus,
  Video,
  FileCode2,
  Calendar,
  Layers,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function CourseBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;

  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isWeekModalOpen, setIsWeekModalOpen] = useState(false);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);

  // Form states
  const [weekTitle, setWeekTitle] = useState("");
  const [weekNumber, setWeekNumber] = useState(1);
  const [selectedWeekId, setSelectedWeekId] = useState<string>("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDesc, setLessonDesc] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [lessonDuration, setLessonDuration] = useState(45);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceDriveUrl, setResourceDriveUrl] = useState("");
  const [resourceFileType, setResourceFileType] = useState<string>("pdf");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCourseData = async () => {
    try {
      // 1. Fetch course
      const courseDoc = await getDoc(doc(db, "courses", courseId));
      if (courseDoc.exists()) {
        setCourse({ id: courseDoc.id, ...courseDoc.data() } as Course);
      }

      // 2. Fetch weeks
      const weeksQ = query(collection(db, "weeks"), where("courseId", "==", courseId));
      const weeksSnap = await getDocs(weeksQ);
      const weeksList: Week[] = [];
      weeksSnap.forEach((d) => weeksList.push({ id: d.id, ...d.data() } as Week));
      weeksList.sort((a, b) => a.weekNumber - b.weekNumber);
      setWeeks(weeksList);

      // 3. Fetch modules
      const modulesQ = query(collection(db, "modules"), where("courseId", "==", courseId));
      const modulesSnap = await getDocs(modulesQ);
      const modulesList: Module[] = [];
      modulesSnap.forEach((d) => modulesList.push({ id: d.id, ...d.data() } as Module));
      modulesList.sort((a, b) => a.orderIndex - b.orderIndex);
      setModules(modulesList);

      // 4. Fetch lessons
      const lessonsQ = query(collection(db, "lessons"), where("courseId", "==", courseId));
      const lessonsSnap = await getDocs(lessonsQ);
      const lessonsList: Lesson[] = [];
      lessonsSnap.forEach((d) => lessonsList.push({ id: d.id, ...d.data() } as Lesson));
      lessonsList.sort((a, b) => a.orderIndex - b.orderIndex);
      setLessons(lessonsList);

      // 5. Fetch resources
      const resQ = query(collection(db, "resources"), where("courseId", "==", courseId));
      const resSnap = await getDocs(resQ);
      const resList: Resource[] = [];
      resSnap.forEach((d) => resList.push({ id: d.id, ...d.data() } as Resource));
      setResources(resList);
    } catch (err) {
      console.error("Error loading curriculum:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  // Add Week
  const handleAddWeek = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      const token = await user.getIdToken(true);
      let res: Response | null = null;
      try {
        res = await fetch("/api/admin/weeks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            courseId,
            title: weekTitle,
            weekNumber: Number(weekNumber),
            isPublished: true,
          }),
        });
      } catch (fetchErr) {
        console.warn("API add week failed, falling back to direct Firestore:", fetchErr);
      }

      if (!res || !res.ok) {
        // Direct Firestore fallback
        await addDoc(collection(db, "weeks"), {
          courseId,
          title: weekTitle,
          weekNumber: Number(weekNumber),
          isPublished: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      toastSuccess("Week created", `Week ${weekNumber} added.`);
      setIsWeekModalOpen(false);
      setWeekTitle("");
      setWeekNumber(weeks.length + 2);
      fetchCourseData();
    } catch (err: any) {
      toastError("Error", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Module
  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedWeekId) return;
    setIsSubmitting(true);
    try {
      const token = await user.getIdToken(true);
      let res: Response | null = null;
      try {
        res = await fetch("/api/admin/modules", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            courseId,
            weekId: selectedWeekId,
            title: moduleTitle,
            orderIndex: modules.filter((m) => m.weekId === selectedWeekId).length,
            isPublished: true,
          }),
        });
      } catch (fetchErr) {
        console.warn("API add module failed, falling back to direct Firestore:", fetchErr);
      }

      if (!res || !res.ok) {
        // Direct Firestore fallback
        await addDoc(collection(db, "modules"), {
          courseId,
          weekId: selectedWeekId,
          title: moduleTitle,
          orderIndex: modules.filter((m) => m.weekId === selectedWeekId).length,
          isPublished: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      toastSuccess("Module created", `"${moduleTitle}" added.`);
      setIsModuleModalOpen(false);
      setModuleTitle("");
      fetchCourseData();
    } catch (err: any) {
      toastError("Error", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Lesson
  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedWeekId || !selectedModuleId) return;

    const vidId = extractYouTubeVideoId(youtubeUrl);
    if (!vidId) {
      toastError("Invalid Video", "Please provide a valid YouTube video URL or ID.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await user.getIdToken(true);
      let res: Response | null = null;
      let result: any = null;
      try {
        res = await fetch("/api/admin/lessons", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            courseId,
            weekId: selectedWeekId,
            moduleId: selectedModuleId,
            title: lessonTitle,
            description: lessonDesc,
            youtubeUrl,
            duration: Number(lessonDuration),
            orderIndex: lessons.filter((l) => l.moduleId === selectedModuleId).length,
            isPublished: true,
          }),
        });

        if (res) {
          const text = await res.text();
          result = text ? JSON.parse(text) : null;
        }
      } catch (fetchErr) {
        console.warn("API add lesson failed, falling back to direct Firestore:", fetchErr);
      }

      if (!res || !res.ok) {
        // Direct Firestore fallback
        await addDoc(collection(db, "lessons"), {
          courseId,
          weekId: selectedWeekId,
          moduleId: selectedModuleId,
          title: lessonTitle,
          description: lessonDesc,
          youtubeUrl,
          youtubeVideoId: vidId,
          duration: Number(lessonDuration),
          orderIndex: lessons.filter((l) => l.moduleId === selectedModuleId).length,
          isPublished: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      toastSuccess("Lesson added", `"${lessonTitle}" added with video ID ${vidId}.`);
      setIsLessonModalOpen(false);
      setLessonTitle("");
      setLessonDesc("");
      setYoutubeUrl("");
      fetchCourseData();
    } catch (err: any) {
      toastError("Error", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Resource
  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedWeekId) return;

    if (!validateDriveUrl(resourceDriveUrl)) {
      toastError("Invalid Drive URL", "Must be a valid drive.google.com or docs.google.com link.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await user.getIdToken(true);
      let res: Response | null = null;
      try {
        res = await fetch("/api/admin/resources", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            courseId,
            weekId: selectedWeekId,
            title: resourceTitle,
            fileType: resourceFileType,
            category: resourceFileType,
            driveUrl: resourceDriveUrl,
            orderIndex: resources.filter((r) => r.weekId === selectedWeekId).length,
          }),
        });
      } catch (fetchErr) {
        console.warn("API add resource failed, falling back to direct Firestore:", fetchErr);
      }

      if (!res || !res.ok) {
        // Direct Firestore fallback
        await addDoc(collection(db, "resources"), {
          courseId,
          weekId: selectedWeekId,
          title: resourceTitle,
          fileType: resourceFileType,
          category: resourceFileType,
          driveUrl: resourceDriveUrl,
          orderIndex: resources.filter((r) => r.weekId === selectedWeekId).length,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      toastSuccess("Resource attached", `"${resourceTitle}" linked.`);
      setIsResourceModalOpen(false);
      setResourceTitle("");
      setResourceDriveUrl("");
      fetchCourseData();
    } catch (err: any) {
      toastError("Error", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (type: "week" | "module" | "lesson" | "resource", id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      const endpoint = `/api/admin/${type}s?id=${id}`;
      let res: Response | null = null;
      try {
        res = await fetch(endpoint, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (fetchErr) {
        console.warn(`API delete ${type} failed, falling back to direct Firestore:`, fetchErr);
      }

      if (!res || !res.ok) {
        // Direct Firestore fallback
        const collectionName = type === "resource" ? "resources" : `${type}s`;
        await deleteDoc(doc(db, collectionName, id));
      }

      toastSuccess("Deleted", `${type} removed.`);
      fetchCourseData();
    } catch (err: any) {
      toastError("Failed to delete", err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button and Course Header */}
      <div className="space-y-3">
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Courses
        </Link>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {course?.name || "Curriculum Builder"}
              </h1>
              <Badge variant="outline" className="text-teal-600 dark:text-teal-400 border-teal-500/30 text-xs">
                {course?.batchName || "Batch 2026"}
              </Badge>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Add weekly modules, YouTube video recordings, and Google Drive resources.
            </p>
          </div>

          <Button
            onClick={() => {
              setWeekNumber(weeks.length + 1);
              setIsWeekModalOpen(true);
            }}
            className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Week Milestone
          </Button>
        </div>
      </div>

      {/* Curriculum Weeks Hierarchy */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-28 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          <div className="h-28 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        </div>
      ) : weeks.length === 0 ? (
        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-8 text-center space-y-3">
          <Layers className="h-8 w-8 text-slate-400 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No Weeks Added Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Organize your course into weekly phases (e.g., Week 1: Foundations, Week 2: Pipelines).
          </p>
          <Button
            onClick={() => {
              setWeekNumber(1);
              setIsWeekModalOpen(true);
            }}
            size="sm"
            className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs"
          >
            Add Week 1
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {weeks.map((week) => {
            const weekModules = modules.filter((m) => m.weekId === week.id);
            const weekResources = resources.filter((r) => r.weekId === week.id);

            return (
              <Card key={week.id} className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-md">
                <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800/80">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-xs">
                        W{week.weekNumber}
                      </div>
                      <div>
                        <CardTitle className="text-base text-slate-900 dark:text-white">
                          Week {week.weekNumber}: {week.title}
                        </CardTitle>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedWeekId(week.id);
                          setIsModuleModalOpen(true);
                        }}
                        className="text-xs border-slate-700 h-8 gap-1 text-slate-200"
                      >
                        <Plus className="h-3 w-3" />
                        Add Module
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedWeekId(week.id);
                          setIsResourceModalOpen(true);
                        }}
                        className="text-xs border-slate-700 h-8 gap-1 text-cyan-400"
                      >
                        <FileCode2 className="h-3 w-3" />
                        Attach Material
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteItem("week", week.id)}
                        className="h-8 w-8 text-slate-500 hover:text-red-400"
                        title="Delete Week"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  {/* Modules inside Week */}
                  {weekModules.length === 0 ? (
                    <div className="p-4 rounded-lg border border-dashed border-slate-800 text-center text-xs text-slate-500">
                      No modules yet. Click &quot;Add Module&quot; to add chapters.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {weekModules.map((module) => {
                        const moduleLessons = lessons.filter(
                          (l) => l.moduleId === module.id
                        );

                        return (
                          <div
                            key={module.id}
                            className="p-4 rounded-xl border border-slate-800/80 bg-slate-800/30 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-200">
                                  {module.title}
                                </span>
                                <Badge variant="secondary" className="text-[10px]">
                                  {moduleLessons.length} Lessons
                                </Badge>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedWeekId(week.id);
                                    setSelectedModuleId(module.id);
                                    setIsLessonModalOpen(true);
                                  }}
                                  className="h-7 text-[11px] bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold gap-1"
                                >
                                  <Video className="h-3 w-3" />
                                  Add Lesson
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDeleteItem("module", module.id)}
                                  className="h-7 w-7 text-slate-500 hover:text-red-400"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Lessons List */}
                            {moduleLessons.length === 0 ? (
                              <p className="text-[11px] text-slate-500 pl-2">
                                No lessons added to this module yet.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {moduleLessons.map((lesson) => (
                                  <div
                                    key={lesson.id}
                                    className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <Video className="h-4 w-4 text-teal-400 shrink-0" />
                                      <div className="min-w-0">
                                        <p className="font-semibold text-slate-100 truncate">
                                          {lesson.title}
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                          Video ID:{" "}
                                          <span className="font-mono text-teal-300">
                                            {lesson.youtubeVideoId}
                                          </span>{" "}
                                          • {lesson.duration}m
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setPreviewVideoId(lesson.youtubeVideoId)}
                                        className="h-7 text-[11px] text-cyan-400 hover:text-cyan-300"
                                      >
                                        Preview
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleDeleteItem("lesson", lesson.id)}
                                        className="h-7 w-7 text-slate-500 hover:text-red-400"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Attached Resources */}
                  {weekResources.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-2">
                        Attached Google Drive Resources
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {weekResources.map((res) => (
                          <div
                            key={res.id}
                            className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/60 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileCode2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                              <div className="min-w-0">
                                <p className="font-medium text-slate-200 truncate">
                                  {res.title}
                                </p>
                                <span className="text-[10px] text-slate-400 uppercase">
                                  {res.fileType}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <a
                                href={res.driveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-teal-400 hover:text-teal-300 p-1"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                              <button
                                onClick={() => handleDeleteItem("resource", res.id)}
                                className="text-slate-500 hover:text-red-400 p-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Week Modal */}
      <Dialog
        open={isWeekModalOpen}
        onClose={() => setIsWeekModalOpen(false)}
        title="Add Week Milestone"
        description="Create a weekly curriculum phase (e.g. Ingestion, Transformation)"
      >
        <form onSubmit={handleAddWeek} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="weekNumber" required>
              Week Number
            </Label>
            <Input
              id="weekNumber"
              type="number"
              min={1}
              value={weekNumber}
              onChange={(e) => setWeekNumber(Number(e.target.value))}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="weekTitle" required>
              Week Title / Focus Area
            </Label>
            <Input
              id="weekTitle"
              placeholder="e.g. Distributed Ingestion with Kafka & Flink"
              value={weekTitle}
              onChange={(e) => setWeekTitle(e.target.value)}
              required
            />
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsWeekModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold"
            >
              {isSubmitting ? "Adding..." : "Add Week"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Module Modal */}
      <Dialog
        open={isModuleModalOpen}
        onClose={() => setIsModuleModalOpen(false)}
        title="Add Course Module"
        description="Add a structured topic or module to this week"
      >
        <form onSubmit={handleAddModule} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="moduleTitle" required>
              Module Title
            </Label>
            <Input
              id="moduleTitle"
              placeholder="e.g. Part 1: Architecture & Concepts"
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              required
            />
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModuleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold"
            >
              {isSubmitting ? "Adding..." : "Add Module"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Lesson Modal */}
      <Dialog
        open={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
        title="Add Lesson Recording"
        description="Link a private or unlisted YouTube recording to this module"
        className="max-w-lg"
      >
        <form onSubmit={handleAddLesson} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="lessonTitle" required>
              Lesson Title
            </Label>
            <Input
              id="lessonTitle"
              placeholder="e.g. Session 1: Building Scalable Event Pipelines"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="youtubeUrl" required>
              YouTube Video URL or ID
            </Label>
            <Input
              id="youtubeUrl"
              placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              required
            />
            <p className="text-[11px] text-slate-500">
              Works with unlisted or private YouTube session recordings.
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="duration">Estimated Duration (Minutes)</Label>
            <Input
              id="duration"
              type="number"
              min={1}
              value={lessonDuration}
              onChange={(e) => setLessonDuration(Number(e.target.value))}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="lessonDesc">Lesson Summary &amp; Key Takeaways</Label>
            <Textarea
              id="lessonDesc"
              placeholder="Outline of core concepts discussed in this recording..."
              rows={2}
              value={lessonDesc}
              onChange={(e) => setLessonDesc(e.target.value)}
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsLessonModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold"
            >
              {isSubmitting ? "Adding..." : "Add Lesson"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Resource Modal */}
      <Dialog
        open={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        title="Attach Google Drive Resource"
        description="Link slides, notebooks, or datasets stored in Google Drive"
      >
        <form onSubmit={handleAddResource} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="resourceTitle" required>
              Resource Title
            </Label>
            <Input
              id="resourceTitle"
              placeholder="e.g. Week 1 Hands-on Labs & Code Templates"
              value={resourceTitle}
              onChange={(e) => setResourceTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="driveUrl" required>
              Google Drive URL
            </Label>
            <Input
              id="driveUrl"
              type="url"
              placeholder="https://drive.google.com/file/d/.../view"
              value={resourceDriveUrl}
              onChange={(e) => setResourceDriveUrl(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="fileType" required>
              Resource Category
            </Label>
            <select
              id="fileType"
              value={resourceFileType}
              onChange={(e) => setResourceFileType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="pdf">PDF Document / Slides</option>
              <option value="presentation">Presentation (PPT / Slides)</option>
              <option value="document">Document (Doc / Spec)</option>
              <option value="spreadsheet">Spreadsheet (XLSX / CSV)</option>
              <option value="archive">Archive (ZIP / Tar)</option>
              <option value="other">Code Repository / Other</option>
            </select>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsResourceModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold"
            >
              {isSubmitting ? "Attaching..." : "Attach Resource"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Video Preview Modal */}
      <Dialog
        open={previewVideoId !== null}
        onClose={() => setPreviewVideoId(null)}
        title="Video Recording Preview"
        className="max-w-3xl"
      >
        {previewVideoId && (
          <div className="space-y-4">
            <div className="video-container rounded-lg overflow-hidden border border-slate-800 bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${previewVideoId}?rel=0&modestbranding=1`}
                title="YouTube Video Preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <p className="text-xs text-slate-400">
              Note: Unlisted YouTube recordings are streamable by cohort members with the embed link. Ensure video permissions allow embedding in your YouTube Studio settings.
            </p>
          </div>
        )}
      </Dialog>
    </div>
  );
}

