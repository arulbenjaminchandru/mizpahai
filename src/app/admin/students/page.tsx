"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { useToast } from "@/components/ui/toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import {
  Users,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  BookOpen,
  Plus,
  Loader2,
} from "lucide-react";
import type { User, Course } from "@/types";

export default function AdminStudentsPage() {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [students, setStudents] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Direct assign course modal state
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStudents = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const url = searchQuery
        ? `/api/admin/students?search=${encodeURIComponent(searchQuery)}`
        : "/api/admin/students";

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
        if (data.courses?.length > 0) {
          setSelectedCourseId(data.courses[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, [user]);

  const handleToggleStatus = async (student: User) => {
    if (!user) return;
    const newStatus = student.status === "suspended" ? "active" : "suspended";
    const confirmMsg =
      newStatus === "suspended"
        ? `Are you sure you want to suspend "${student.displayName || student.email}"? They will lose access to all courses.`
        : `Reactivate account for "${student.displayName || student.email}"?`;

    if (!confirm(confirmMsg)) return;

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/students", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uid: student.uid, status: newStatus }),
      });

      if (res.ok) {
        toastSuccess(
          newStatus === "suspended" ? "Student Suspended" : "Student Reactivated",
          `Status changed for ${student.email}.`
        );
        fetchStudents();
      }
    } catch (err: any) {
      toastError("Failed to update status", err.message);
    }
  };

  const handleAssignCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedStudent || !selectedCourseId) return;

    setIsSubmitting(true);
    try {
      const token = await user.getIdToken();
      const course = courses.find((c) => c.id === selectedCourseId);
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedStudent.uid,
          courseId: selectedCourseId,
          batchName: course?.batchName || "Batch 2026",
        }),
      });

      if (!res.ok) throw new Error("Failed to assign course");

      toastSuccess(
        "Course Assigned",
        `Assigned "${course?.name}" to ${selectedStudent.email}.`
      );
      setIsAssignModalOpen(false);
    } catch (err: any) {
      toastError("Assignment failed", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Student Roster
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Review registered learners, manage enrollment access, and toggle suspensions.
          </p>
        </div>
      </div>

      {/* Search Filter */}
      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-sm">
        <CardContent className="pt-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchStudents();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <Input
                type="text"
                placeholder="Search by student name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-50 dark:bg-slate-800/80"
              />
            </div>
            <Button
              type="submit"
              className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs"
            >
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-slate-900 dark:text-white">Registered Accounts</CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Total accounts found: {students.length}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <div className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
            </div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
              <Users className="h-8 w-8 text-slate-400 dark:text-slate-600 mx-auto" />
              <p className="text-sm text-slate-600 dark:text-slate-400">No students found matching your query.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {students.map((st) => (
                <div
                  key={st.uid}
                  className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">
                        {st.displayName || "Learner"}
                      </span>
                      <Badge
                        variant={st.role === "admin" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {st.role}
                      </Badge>
                      <Badge
                        variant={st.status === "suspended" ? "destructive" : "outline"}
                        className="text-[10px]"
                      >
                        {st.status || "active"}
                      </Badge>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{st.email}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      UID: {st.uid}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedStudent(st);
                        setIsAssignModalOpen(true);
                      }}
                      className="border-slate-300 dark:border-slate-700 text-xs h-8 gap-1.5 text-teal-600 dark:text-teal-300"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      Assign Course
                    </Button>

                    {st.role !== "admin" && (
                      <Button
                        size="sm"
                        variant={st.status === "suspended" ? "outline" : "ghost"}
                        onClick={() => handleToggleStatus(st)}
                        className={`text-xs h-8 gap-1 ${
                          st.status === "suspended"
                            ? "text-emerald-400 border-emerald-500/30"
                            : "text-red-400 hover:text-red-300 hover:bg-red-950/20"
                        }`}
                      >
                        {st.status === "suspended" ? (
                          <>
                            <UserCheck className="h-3.5 w-3.5" />
                            Reactivate
                          </>
                        ) : (
                          <>
                            <UserX className="h-3.5 w-3.5" />
                            Suspend
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Course Dialog */}
      <Dialog
        open={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Direct Course Assignment"
        description={`Grant "${selectedStudent?.displayName || selectedStudent?.email}" access to a curriculum without an enrollment code.`}
      >
        <form onSubmit={handleAssignCourse} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="courseSelect" required>
              Select Course
            </Label>
            <select
              id="courseSelect"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.batchName || "Standard"})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAssignModalOpen(false)}
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
                  Assigning...
                </span>
              ) : (
                "Confirm Assignment"
              )}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
