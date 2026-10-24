"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/firebase/auth-context";
import { useToast } from "@/components/ui/toast";
import { courseSchema, type CourseFormData } from "@/lib/validations";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  BookOpen,
  Plus,
  Loader2,
  Calendar,
  Layers,
  Settings,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import type { Course } from "@/types";

export default function AdminCoursesPage() {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      batchName: "Batch 2026",
      isPublished: true,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
  });

  const fetchCourses = async () => {
    if (!user) return;
    try {
      // Force token refresh so custom claims (e.g. admin role) are always fresh
      const token = await user.getIdToken(true);
      const res = await fetch("/api/admin/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.courses && Array.isArray(data.courses) && data.courses.length > 0) {
          setCourses(data.courses);
          return;
        }
      }
      // Fallback: Read directly via Firestore client SDK (same method as student dashboard)
      const snap = await getDocs(collection(db, "courses"));
      const fallbackList = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Course[];
      setCourses(fallbackList);
    } catch (err) {
      console.warn("API fetch failed, falling back to direct Firestore:", err);
      try {
        const snap = await getDocs(collection(db, "courses"));
        const fallbackList = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Course[];
        setCourses(fallbackList);
      } catch (clientErr) {
        console.error("Direct Firestore load failed:", clientErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const onSubmit = async (data: CourseFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const token = await user.getIdToken(true);
      let res: Response | null = null;
      let result: any = null;

      try {
        res = await fetch("/api/admin/courses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (res) {
          const text = await res.text();
          result = text ? JSON.parse(text) : null;
        }
      } catch (fetchErr) {
        console.warn("API course creation failed, falling back to direct Firestore:", fetchErr);
      }

      if (res && res.ok && result?.success) {
        toastSuccess("Course created", `"${data.name}" added successfully.`);
        setIsModalOpen(false);
        reset();
        fetchCourses();
        return;
      }

      // If server returned a business validation error (e.g. duplicate slug or bad input)
      if (res && res.status === 400 && result?.error) {
        throw new Error(result.error);
      }

      // Direct Firestore creation fallback
      await addDoc(collection(db, "courses"), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toastSuccess("Course created", `"${data.name}" added successfully.`);
      setIsModalOpen(false);
      reset();
      fetchCourses();
    } catch (err: any) {
      toastError("Creation failed", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (course: Course) => {
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      let res: Response | null = null;
      try {
        res = await fetch(`/api/admin/courses/${course.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isPublished: !course.isPublished }),
        });
      } catch (fetchErr) {
        console.warn("API toggle publish failed, falling back to direct Firestore:", fetchErr);
      }

      if (!res || !res.ok) {
        // Direct Firestore fallback
        await updateDoc(doc(db, "courses", course.id), {
          isPublished: !course.isPublished,
          updatedAt: serverTimestamp(),
        });
      }

      toastSuccess(
        course.isPublished ? "Course Unpublished" : "Course Published",
        `Status updated for "${course.name}".`
      );
      fetchCourses();
    } catch (err: any) {
      toastError("Failed to update status", err.message);
    }
  };

  const handleDeleteCourse = async (courseId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      let res: Response | null = null;
      try {
        res = await fetch(`/api/admin/courses/${courseId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (fetchErr) {
        console.warn("API delete course failed, falling back to direct Firestore:", fetchErr);
      }

      if (!res || !res.ok) {
        // Direct Firestore fallback
        await deleteDoc(doc(db, "courses", courseId));
      }

      toastSuccess("Course deleted", `"${name}" removed.`);
      fetchCourses();
    } catch (err: any) {
      toastError("Failed to delete", err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Course Management
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Create and organize training programs, weeks, and video modules.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold gap-1.5 text-xs"
        >
          <Plus className="h-4 w-4" />
          Create New Course
        </Button>
      </div>

      {/* Courses List */}
      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-md">
        <CardHeader>
          <CardTitle className="text-base text-slate-900 dark:text-white">All Courses &amp; Cohorts</CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Manage course structure, curriculum, and publication state
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <div className="h-16 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="h-16 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
            </div>
          ) : courses.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <BookOpen className="h-8 w-8 text-slate-400 dark:text-slate-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No Courses Created Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Get started by creating your first course curriculum.
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                size="sm"
                className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs"
              >
                Create First Course
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 hover:border-teal-500/40 dark:hover:border-slate-700 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {course.name}
                      </h4>
                      <Badge
                        variant="outline"
                        className="text-[10px] text-teal-400 border-teal-500/30"
                      >
                        {course.batchName || "Standard"}
                      </Badge>
                      <Badge
                        variant={course.isPublished ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {course.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                      <span>Instructor: {course.instructorName}</span>
                      <span>•</span>
                      <span>Slug: /{course.slug}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePublish(course)}
                      className="text-xs text-slate-400 hover:text-white"
                      title={course.isPublished ? "Unpublish course" : "Publish course"}
                    >
                      {course.isPublished ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4 text-teal-400" />
                      )}
                    </Button>

                    <Link href={`/admin/courses/${course.id}`}>
                      <Button
                        size="sm"
                        className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs gap-1.5"
                      >
                        <Layers className="h-3.5 w-3.5" />
                        Curriculum Builder
                      </Button>
                    </Link>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCourse(course.id, course.name)}
                      className="h-8 w-8 text-slate-500 hover:text-red-400"
                      title="Delete course"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Course Dialog */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Course"
        description="Configure program details and batch assignment for students"
        className="max-w-xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="name" required>
              Course Name
            </Label>
            <Input
              id="name"
              placeholder="e.g. Data Engineering & GenAI Masterclass"
              error={errors.name?.message}
              {...register("name", {
                onChange: (e) => {
                  // auto-generate slug
                  const slugVal = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "");
                  setValue("slug", slugVal);
                },
              })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="slug" required>
                URL Slug
              </Label>
              <Input
                id="slug"
                placeholder="data-engineering-masterclass"
                error={errors.slug?.message}
                {...register("slug")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="batchName" required>
                Batch / Cohort
              </Label>
              <Input
                id="batchName"
                placeholder="Batch 2026"
                error={errors.batchName?.message}
                {...register("batchName")}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="instructorName" required>
              Instructor Name
            </Label>
            <Input
              id="instructorName"
              placeholder="e.g. Arul B."
              error={errors.instructorName?.message}
              {...register("instructorName")}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="description" required>
              Course Description
            </Label>
            <Textarea
              id="description"
              placeholder="Comprehensive curriculum covering distributed systems, Kafka, Spark, and Generative AI pipelines..."
              rows={3}
              error={errors.description?.message}
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="startDate" required>
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                error={errors.startDate?.message}
                {...register("startDate")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="endDate" required>
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                error={errors.endDate?.message}
                {...register("endDate")}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="coverImageUrl">Cover Image URL (Optional)</Label>
            <Input
              id="coverImageUrl"
              type="url"
              placeholder="https://images.unsplash.com/..."
              error={errors.coverImageUrl?.message}
              {...register("coverImageUrl")}
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </span>
              ) : (
                "Create Course"
              )}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

