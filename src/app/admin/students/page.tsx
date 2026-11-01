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
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
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
  FileSpreadsheet,
  Phone,
  PhoneOff,
  History,
  XCircle,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import type { User, Course, CourseAccessAudit } from "@/types";

export default function AdminStudentsPage() {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [students, setStudents] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollmentsMap, setEnrollmentsMap] = useState<Record<string, any[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileFilter, setMobileFilter] = useState<"all" | "with_mobile" | "missing_mobile">("all");
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Direct assign course modal state
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Revoke course access modal state
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [revokeStudent, setRevokeStudent] = useState<User | null>(null);
  const [revokeCourse, setRevokeCourse] = useState<{ id: string; name: string } | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [isRevoking, setIsRevoking] = useState(false);

  // Access audit log modal state
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<CourseAccessAudit[]>([]);
  const [loadingAudits, setLoadingAudits] = useState(false);

  const fetchStudents = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      const url = searchQuery
        ? `/api/admin/students?search=${encodeURIComponent(searchQuery)}`
        : "/api/admin/students";

      const [res, enrSnap] = await Promise.all([
        fetch(url, { headers: { Authorization: `Bearer ${token}` } }),
        getDocs(collection(db, "enrollments")),
      ]);

      const eMap: Record<string, any[]> = {};
      enrSnap.docs.forEach((d) => {
        const data = d.data();
        const uid = data.userId;
        if (!eMap[uid]) eMap[uid] = [];
        eMap[uid].push(data);
      });
      setEnrollmentsMap(eMap);

      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        return;
      }

      // Direct Firestore fallback
      const usersSnap = await getDocs(collection(db, "users"));
      let fallbackUsers = usersSnap.docs.map((d) => ({
        uid: d.id,
        ...d.data(),
      })) as User[];

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        fallbackUsers = fallbackUsers.filter(
          (s) =>
            s.email?.toLowerCase().includes(q) ||
            s.displayName?.toLowerCase().includes(q) ||
            s.phoneNumber?.includes(q)
        );
      }
      setStudents(fallbackUsers);
    } catch (err) {
      console.error("Error fetching students:", err);
      try {
        const [usersSnap, enrSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "enrollments")),
        ]);
        const eMap: Record<string, any[]> = {};
        enrSnap.docs.forEach((d) => {
          const data = d.data();
          const uid = data.userId;
          if (!eMap[uid]) eMap[uid] = [];
          eMap[uid].push(data);
        });
        setEnrollmentsMap(eMap);

        let fallbackUsers = usersSnap.docs.map((d) => ({
          uid: d.id,
          ...d.data(),
        })) as User[];

        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          fallbackUsers = fallbackUsers.filter(
            (s) =>
              s.email?.toLowerCase().includes(q) ||
              s.displayName?.toLowerCase().includes(q) ||
              s.phoneNumber?.includes(q)
          );
        }
        setStudents(fallbackUsers);
      } catch (clientErr) {
        console.error("Direct Firestore student load failed:", clientErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      const res = await fetch("/api/admin/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.courses && Array.isArray(data.courses) && data.courses.length > 0) {
          setCourses(data.courses);
          setSelectedCourseId(data.courses[0].id);
          return;
        }
      }
      // Direct Firestore fallback
      const snap = await getDocs(collection(db, "courses"));
      const fallbackList = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Course[];
      setCourses(fallbackList);
      if (fallbackList.length > 0) {
        setSelectedCourseId(fallbackList[0].id);
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, [user]);

  const handleExportExcel = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      const token = await user.getIdToken();
      let exportUrl = `/api/admin/export/registrations?search=${encodeURIComponent(searchQuery)}`;
      if (mobileFilter === "with_mobile") exportUrl += "&hasMobile=true";
      if (mobileFilter === "missing_mobile") exportUrl += "&hasMobile=false";

      const res = await fetch(exportUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate Excel export");
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
      toastError("Export Failed", err.message || "Could not export registrations");
    } finally {
      setIsExporting(false);
    }
  };

  const handleToggleStatus = async (student: User) => {
    if (!user) return;
    const newStatus = student.status === "suspended" ? "active" : "suspended";
    const confirmMsg =
      newStatus === "suspended"
        ? `Are you sure you want to suspend "${student.displayName || student.email}"? They will lose access to all courses.`
        : `Reactivate account for "${student.displayName || student.email}"?`;

    if (!confirm(confirmMsg)) return;

    try {
      const token = await user.getIdToken(true);
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
        return;
      }

      // Direct Firestore update fallback
      await updateDoc(doc(db, "users", student.uid), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      toastSuccess(
        newStatus === "suspended" ? "Student Suspended" : "Student Reactivated",
        `Status changed for ${student.email}.`
      );
      fetchStudents();
    } catch (err: any) {
      try {
        await updateDoc(doc(db, "users", student.uid), {
          status: newStatus,
          updatedAt: serverTimestamp(),
        });
        toastSuccess(
          newStatus === "suspended" ? "Student Suspended" : "Student Reactivated",
          `Status changed for ${student.email}.`
        );
        fetchStudents();
      } catch (fallbackErr: any) {
        toastError("Failed to update status", fallbackErr.message || err.message);
      }
    }
  };

  const handleAssignCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedStudent || !selectedCourseId) return;

    setIsSubmitting(true);
    try {
      const token = await user.getIdToken(true);
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

      if (res.ok) {
        toastSuccess(
          "Course Assigned",
          `Assigned "${course?.name}" to ${selectedStudent.email}.`
        );
        setIsAssignModalOpen(false);
        fetchStudents();
        return;
      }

      // Direct Firestore assignment fallback
      const enrollmentId = `${selectedStudent.uid}_${selectedCourseId}`;
      await setDoc(doc(db, "enrollments", enrollmentId), {
        userId: selectedStudent.uid,
        courseId: selectedCourseId,
        batchName: course?.batchName || "Batch 2026",
        enrollmentCodeId: "admin-direct-assignment",
        status: "active",
        enrolledAt: serverTimestamp(),
      });

      toastSuccess(
        "Course Assigned",
        `Assigned "${course?.name}" to ${selectedStudent.email}.`
      );
      setIsAssignModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      try {
        const course = courses.find((c) => c.id === selectedCourseId);
        const enrollmentId = `${selectedStudent.uid}_${selectedCourseId}`;
        await setDoc(doc(db, "enrollments", enrollmentId), {
          userId: selectedStudent.uid,
          courseId: selectedCourseId,
          batchName: course?.batchName || "Batch 2026",
          enrollmentCodeId: "admin-direct-assignment",
          status: "active",
          enrolledAt: serverTimestamp(),
        });

        toastSuccess(
          "Course Assigned",
          `Assigned "${course?.name}" to ${selectedStudent.email}.`
        );
        setIsAssignModalOpen(false);
        fetchStudents();
      } catch (fallbackErr: any) {
        toastError("Assignment failed", fallbackErr.message || err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRevokeModal = (student: User, courseId: string, courseName: string) => {
    setRevokeStudent(student);
    setRevokeCourse({ id: courseId, name: courseName });
    setRevokeReason("");
    setRevokeModalOpen(true);
  };

  const handleConfirmRevoke = async () => {
    if (!user || !revokeStudent || !revokeCourse) return;
    setIsRevoking(true);
    try {
      const token = await user.getIdToken(true);
      const res = await fetch("/api/admin/students/revoke-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: revokeStudent.uid,
          courseId: revokeCourse.id,
          reason: revokeReason.trim() || "Revoked by administrator",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to revoke course access");
      }

      toastSuccess(
        "Course Access Revoked",
        `Access to "${revokeCourse.name}" has been revoked for ${revokeStudent.displayName || revokeStudent.email}.`
      );
      setRevokeModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      toastError("Revocation Failed", err.message);
    } finally {
      setIsRevoking(false);
    }
  };

  const openAuditModal = async () => {
    setAuditModalOpen(true);
    setLoadingAudits(true);
    try {
      const token = await user?.getIdToken(true);
      const res = await fetch("/api/admin/access-audits", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.audits || []);
      }
    } catch (err: any) {
      toastError("Failed to load audit logs", err.message);
    } finally {
      setLoadingAudits(false);
    }
  };

  // Filter students based on mobile number status
  const filteredStudents = students.filter((st) => {
    const hasPhone = Boolean(st.phoneNumber && st.phoneNumber.trim().length > 0);
    if (mobileFilter === "with_mobile") return hasPhone;
    if (mobileFilter === "missing_mobile") return !hasPhone;
    return true;
  });

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

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openAuditModal}
            className="border-slate-300 dark:border-slate-700 text-xs gap-1.5 h-9"
          >
            <History className="h-3.5 w-3.5 text-teal-500" />
            <span>Access Audit History</span>
          </Button>

          <Button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 text-xs shadow-sm h-9"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            <span>Export to Excel (.xlsx)</span>
          </Button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchStudents();
              }}
              className="flex-1 flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <Input
                  type="text"
                  placeholder="Search by student name, email, or mobile..."
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

            <select
              value={mobileFilter}
              onChange={(e) => setMobileFilter(e.target.value as any)}
              className="h-10 px-3 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500 shrink-0"
            >
              <option value="all">All Profiles ({students.length})</option>
              <option value="with_mobile">
                With Mobile ({students.filter((s) => s.phoneNumber && s.phoneNumber.trim().length > 0).length})
              </option>
              <option value="missing_mobile">
                Missing Mobile ({students.filter((s) => !s.phoneNumber || s.phoneNumber.trim().length === 0).length})
              </option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-slate-900 dark:text-white">Registered Accounts</CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Showing {filteredStudents.length} of {students.length} accounts
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
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
              <Users className="h-8 w-8 text-slate-400 dark:text-slate-600 mx-auto" />
              <p className="text-sm text-slate-600 dark:text-slate-400">No students found matching your criteria.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredStudents.map((st) => (
                <div
                  key={st.uid}
                  className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
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

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 dark:text-slate-400">
                      <span>{st.email}</span>
                      <span className="text-slate-400">•</span>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-teal-500" />
                        {st.phoneNumber ? (
                          <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                            {st.phoneNumber}
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                            Missing Mobile
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      UID: {st.uid}
                    </p>

                    {/* Student Course Enrollments */}
                    {(() => {
                      const studentEnrollments = enrollmentsMap[st.uid] || [];
                      return (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {studentEnrollments.length > 0 ? (
                            studentEnrollments.map((enr, idx) => {
                              const course = courses.find((c) => c.id === enr.courseId);
                              const cName = course?.name || enr.courseId;
                              const isRevoked = enr.status === "revoked";

                              return (
                                <div
                                  key={idx}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] ${
                                    isRevoked
                                      ? "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                      : "border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300"
                                  }`}
                                >
                                  <span className="font-semibold">
                                    {isRevoked ? "✗ Revoked:" : "✓ Active:"} {cName}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    ({enr.batchName || "Batch 2026"})
                                  </span>

                                  {!isRevoked && (
                                    <button
                                      type="button"
                                      onClick={() => openRevokeModal(st, enr.courseId, cName)}
                                      className="ml-1 text-[10px] text-rose-500 hover:text-rose-700 underline font-medium cursor-pointer"
                                      title="Revoke access to this course"
                                    >
                                      Revoke
                                    </button>
                                  )}

                                  {isRevoked && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedStudent(st);
                                        setSelectedCourseId(enr.courseId);
                                        setIsAssignModalOpen(true);
                                      }}
                                      className="ml-1 text-[10px] text-teal-600 dark:text-teal-400 hover:underline font-medium cursor-pointer"
                                      title="Reactivate course access"
                                    >
                                      Re-grant
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                              No course enrollments
                            </span>
                          )}
                        </div>
                      );
                    })()}
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
                        variant={st.status === "suspended" ? "default" : "outline"}
                        onClick={() => handleToggleStatus(st)}
                        className={`text-xs h-8 gap-1.5 ${
                          st.status === "suspended"
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "border-red-500/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
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

      {/* Direct Assign Course Modal */}
      <Dialog
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Direct Course Assignment"
      >
        <form onSubmit={handleAssignCourse} className="space-y-4 pt-2">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Directly enroll{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {selectedStudent?.displayName || selectedStudent?.email}
            </span>{" "}
            into a cohort curriculum.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="courseSelect" required>
              Select Course &amp; Cohort
            </Label>
            <select
              id="courseSelect"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full h-10 px-3 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              required
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.batchName || "Batch 2026"})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAssignModalOpen(false)}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Confirm Enrollment
                </>
              )}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── REVOKE COURSE ACCESS CONFIRMATION MODAL ───────────────────────── */}
      <Dialog
        isOpen={revokeModalOpen}
        onClose={() => setRevokeModalOpen(false)}
        title="Revoke Course Access?"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">
                  Are you sure you want to revoke this student&apos;s access to {revokeCourse?.name}?
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                  The student will no longer be able to access the course content or protected course resources.
                </p>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
            <p className="font-medium text-slate-900 dark:text-white">
              Student: {revokeStudent?.displayName || "Learner"} ({revokeStudent?.email})
            </p>
            <p className="text-slate-500">
              Target Course: <span className="font-semibold text-teal-600 dark:text-teal-400">{revokeCourse?.name}</span>
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
              Note: Access to any other courses enrolled by this student will remain completely unaffected.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="revokeReason" className="text-xs">
              Revocation Reason (Optional)
            </Label>
            <Input
              id="revokeReason"
              type="text"
              placeholder="e.g. Refund processed, batch transfer, or administrative decision"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRevokeModalOpen(false)}
              disabled={isRevoking}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isRevoking}
              onClick={handleConfirmRevoke}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1.5"
            >
              {isRevoking ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Revoking Access...
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" />
                  Confirm Revoke
                </>
              )}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ─── ACCESS AUDIT LOG MODAL ─────────────────────────────────────────── */}
      <Dialog
        isOpen={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        title="Course Access Audit Trail"
      >
        <div className="space-y-4 max-h-[70vh] flex flex-col">
          <p className="text-xs text-slate-500">
            Immutable audit record of all course access grants and revocations performed by administrators.
          </p>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loadingAudits ? (
              <div className="space-y-2 p-4 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-teal-500 mx-auto" />
                <p className="text-xs text-slate-400">Loading audit trail...</p>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                No access audit records logged yet.
              </div>
            ) : (
              auditLogs.map((log) => {
                const isGranted = log.action === "granted";
                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {log.studentName || "Student"}
                      </span>
                      <Badge
                        className={`text-[10px] ${
                          isGranted
                            ? "bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30"
                            : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {isGranted ? "✓ Access Granted" : "✗ Access Revoked"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-600 dark:text-slate-400">
                      <span>Email: {log.studentEmail}</span>
                      <span>•</span>
                      <span>By: {log.performedByEmail || "Admin"}</span>
                    </div>

                    {log.reason && (
                      <p className="text-[11px] text-slate-500 italic">
                        Reason: {log.reason}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAuditModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
