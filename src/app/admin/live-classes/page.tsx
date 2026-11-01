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
  Video,
  Plus,
  Edit,
  Trash2,
  Users,
  Search,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Loader2,
  Radio,
  UserCheck,
  UserX,
} from "lucide-react";
import type { LiveClass, Course, MeetingPlatform } from "@/types";
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, setDoc, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface ParticipantInfo {
  userId: string;
  enrollmentId: string;
  courseId: string;
  displayName: string;
  email: string;
  phoneNumber?: string | null;
  batchName: string;
  approved: boolean;
  approvedAt?: any;
  approvedBy?: string | null;
  revokedAt?: any;
  revokedBy?: string | null;
}

export default function AdminLiveClassesPage() {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<"classes" | "participants">("classes");
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [participantSearch, setParticipantSearch] = useState("");
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<LiveClass | null>(null);
  const [formCourseId, setFormCourseId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formMeetingUrl, setFormMeetingUrl] = useState("");
  const [formPlatform, setFormPlatform] = useState<MeetingPlatform>("google-meet");
  const [formDate, setFormDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsPublished, setFormIsPublished] = useState(true);

  // 1. Fetch courses
  useEffect(() => {
    async function loadCourses() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/admin/courses", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const list = data.courses || [];
          setCourses(list);
          if (list.length > 0) {
            // Keep selectedCourseId as "" by default to show all courses
            setFormCourseId(list[0].id);
          }
        }
      } catch (err) {
        console.warn("API load courses failed, using Firestore fallback:", err);
      }
      try {
        const snap = await getDocs(collection(db, "courses"));
        const fallbackCourses = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Course[];
        if (fallbackCourses.length > 0) {
          setCourses(fallbackCourses);
          // Keep selectedCourseId as "" by default to show all courses
          setFormCourseId((prev) => prev || fallbackCourses[0].id);
        }
      } catch (clientErr) {
        console.error("Direct Firestore load courses failed:", clientErr);
      }
    }
    loadCourses();
  }, [user]);

  // 2. Fetch live classes
  const fetchClasses = async () => {
    if (!user) return;
    setLoadingClasses(true);
    try {
      const token = await user.getIdToken();
      const url = selectedCourseId
        ? `/api/admin/live-classes?courseId=${selectedCourseId}`
        : "/api/admin/live-classes";
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
      }
    } catch (err) {
        console.warn("API live classes fetch error:", err);
      }
      try {
        const snap = await getDocs(collection(db, "liveClasses"));
        let list: LiveClass[] = snap.docs.map((d) => {
          const data = d.data();
          const course = courses.find((c) => c.id === data.courseId);
          return {
            id: d.id,
            ...data,
            courseName: course?.name || data.courseName || "Course",
          } as LiveClass;
        });
        if (selectedCourseId) {
          list = list.filter((c) => c.courseId === selectedCourseId);
        }
        list.sort((a, b) => (b.scheduledDate || "").localeCompare(a.scheduledDate || ""));
        setClasses(list);
      } catch (clientErr) {
        console.error("Direct Firestore live classes failed:", clientErr);
    } finally {
      setLoadingClasses(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [user, selectedCourseId]);

  // 3. Fetch participants for selected course
  const fetchParticipants = async () => {
    const targetCourseId = selectedCourseId || (courses[0]?.id || "");
    if (!user || !targetCourseId) return;
    setLoadingParticipants(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/admin/live-classes/participants?courseId=${targetCourseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setParticipants(data.participants || []);
        setSelectedUserIds([]);
      }
    } catch (err) {
        console.warn("API participants error, falling back to direct Firestore:", err);
      }
      try {
        const [enrSnap, usersSnap, accessSnap] = await Promise.all([
          getDocs(query(collection(db, "enrollments"), where("courseId", "==", targetCourseId))),
          getDocs(collection(db, "users")),
          getDocs(collection(db, "liveClassAccess")),
        ]);

        const userMap: Record<string, any> = {};
        usersSnap.docs.forEach((d) => {
          userMap[d.id] = d.data();
        });

        const accessMap: Record<string, any> = {};
        accessSnap.docs.forEach((d) => {
          const data = d.data();
          if (data.courseId === targetCourseId) {
            accessMap[data.userId] = data;
          }
        });

        const list: ParticipantInfo[] = enrSnap.docs.map((d) => {
          const enr = d.data();
          const u = userMap[enr.userId] || {};
          const access = accessMap[enr.userId];
          return {
            userId: enr.userId,
            enrollmentId: d.id,
            courseId: targetCourseId,
            displayName: u.displayName || "Student",
            email: u.email || "No email",
            phoneNumber: u.phoneNumber || null,
            batchName: enr.batchName || "Cohort 2026",
            approved: access ? access.approved !== false && access.status !== "revoked" : true,
            approvedAt: access?.approvedAt,
            approvedBy: access?.approvedBy,
            revokedAt: access?.revokedAt,
            revokedBy: access?.revokedBy,
          };
        });

        setParticipants(list);
        setSelectedUserIds([]);
      } catch (clientErr) {
        console.error("Direct Firestore participants failed:", clientErr);
    } finally {
      setLoadingParticipants(false);
    }
  };

  useEffect(() => {
    if (activeTab === "participants") {
      fetchParticipants();
    }
  }, [activeTab, selectedCourseId]);

  // Open modal for new class
  const handleOpenCreateModal = () => {
    setEditingClass(null);
    setFormCourseId(selectedCourseId || (courses[0]?.id || ""));
    setFormTitle("");
    setFormDescription("");
    setFormMeetingUrl("");
    setFormPlatform("google-meet");
    const tomorrow = new Date(Date.now() + 86400000).toISOString().substring(0, 10);
    setFormDate(tomorrow);
    setFormStartTime("10:00 AM");
    setFormEndTime("12:00 PM");
    setFormIsActive(true);
    setFormIsPublished(true);
    setIsModalOpen(true);
  };

  // Open modal for editing class
  const handleOpenEditModal = (c: LiveClass) => {
    setEditingClass(c);
    setFormCourseId(c.courseId);
    setFormTitle(c.title);
    setFormDescription(c.description || "");
    setFormMeetingUrl(c.meetingUrl);
    setFormPlatform(c.meetingPlatform);
    setFormDate(c.scheduledDate);
    setFormStartTime(c.startTime);
    setFormEndTime(c.endTime || "");
    setFormIsActive(c.isActive);
    setFormIsPublished(c.isPublished);
    setIsModalOpen(true);
  };

  // Save class (Create or Edit)
  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formMeetingUrl.trim().startsWith("http://") && !formMeetingUrl.trim().startsWith("https://")) {
      toastError("Invalid URL", "Meeting URL must start with https:// or http://");
      return;
    }
    if (formMeetingUrl.toLowerCase().includes("javascript:")) {
      toastError("Unsafe URL", "javascript: scheme is strictly prohibited.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await user.getIdToken();
      const payload = {
        courseId: formCourseId,
        title: formTitle.trim(),
        description: formDescription.trim(),
        meetingUrl: formMeetingUrl.trim(),
        meetingPlatform: formPlatform,
        scheduledDate: formDate,
        startTime: formStartTime.trim(),
        endTime: formEndTime.trim(),
        isActive: formIsActive,
        isPublished: formIsPublished,
      };

      if (editingClass) {
        const res = await fetch(`/api/admin/live-classes/${editingClass.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          await updateDoc(doc(db, "liveClasses", editingClass.id), {
            ...payload,
            updatedAt: serverTimestamp(),
          });
        }
        toastSuccess("Class Updated", `Updated "${formTitle}" successfully.`);
      } else {
        const res = await fetch("/api/admin/live-classes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          await addDoc(collection(db, "liveClasses"), {
            ...payload,
            courseName: courses.find((c) => c.id === formCourseId)?.name || "Course",
            createdBy: user.email || user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        toastSuccess("Class Created", `Created "${formTitle}" successfully.`);
      }

      setIsModalOpen(false);
      fetchClasses();
    } catch (err: any) {
      console.error("Save class error:", err);
      toastError("Error", err.message || "Could not save live class");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete class
  const handleDeleteClass = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete the live class "${title}"?`)) {
      return;
    }
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/live-classes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        await deleteDoc(doc(db, "liveClasses", id));
      }
      toastSuccess("Class Deleted", `Deleted "${title}".`);
      fetchClasses();
    } catch (err: any) {
      toastError("Error", err.message || "Failed to delete");
    }
  };

  // Toggle published
  const handleTogglePublished = async (c: LiveClass) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/live-classes/${c.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPublished: !c.isPublished }),
      });
      if (res.ok) {
        toastSuccess("Status Updated", `Class ${!c.isPublished ? "published" : "unpublished"}.`);
        fetchClasses();
      }
    } catch (err) {
      console.warn("Toggle publish API failed, using Firestore fallback:", err);
      try {
        await updateDoc(doc(db, "liveClasses", c.id), {
          isPublished: !c.isPublished,
          updatedAt: serverTimestamp(),
        });
        toastSuccess("Status Updated", `Class ${!c.isPublished ? "published" : "unpublished"}.`);
        fetchClasses();
      } catch (clientErr) {
        console.error("Direct Firestore toggle publish error:", clientErr);
      }
    }
  };

  // Toggle active
  const handleToggleActive = async (c: LiveClass) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/live-classes/${c.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      if (res.ok) {
        toastSuccess("Status Updated", `Class marked ${!c.isActive ? "active" : "inactive"}.`);
        fetchClasses();
      }
    } catch (err) {
      console.warn("Toggle active API failed, using Firestore fallback:", err);
      try {
        await updateDoc(doc(db, "liveClasses", c.id), {
          isActive: !c.isActive,
          updatedAt: serverTimestamp(),
        });
        toastSuccess("Status Updated", `Class marked ${!c.isActive ? "active" : "inactive"}.`);
        fetchClasses();
      } catch (clientErr) {
        console.error("Direct Firestore toggle active error:", clientErr);
      }
    }
  };

  // Participant approval actions (Single or Bulk)
  const handleUpdateParticipantAccess = async (userIds: string[], approved: boolean) => {
    if (!user || userIds.length === 0 || !selectedCourseId) return;

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/live-classes/participants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: selectedCourseId,
          userIds,
          approved,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update participant access");
      }

      toastSuccess(
        approved ? "Access Approved" : "Access Revoked",
        `Updated live-class permissions for ${userIds.length} participant(s).`
      );
      fetchParticipants();
    } catch (err: any) {
      console.warn("Participant access API failed, using Firestore fallback:", err);
      try {
        for (const uId of userIds) {
          await setDoc(
            doc(db, "liveClassAccess", `${selectedCourseId}_${uId}`),
            {
              courseId: selectedCourseId,
              userId: uId,
              approved,
              status: approved ? "approved" : "revoked",
              ...(approved
                ? { approvedAt: serverTimestamp(), approvedBy: user.email || user.uid }
                : { revokedAt: serverTimestamp(), revokedBy: user.email || user.uid }),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
        toastSuccess(
          approved ? "Access Approved" : "Access Revoked",
          `Updated live-class permissions for ${userIds.length} participant(s).`
        );
        fetchParticipants();
        return;
      } catch (clientErr) {
        console.error("Direct Firestore participant access update failed:", clientErr);
      }
      toastError("Error", err.message || "Failed to update participant access");
    }
  };

  const handleSelectAllParticipants = () => {
    if (selectedUserIds.length === filteredParticipants.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredParticipants.map((p) => p.userId));
    }
  };

  const filteredParticipants = participants.filter(
    (p) =>
      p.displayName.toLowerCase().includes(participantSearch.toLowerCase()) ||
      p.email.toLowerCase().includes(participantSearch.toLowerCase()) ||
      (p.phoneNumber && p.phoneNumber.includes(participantSearch))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Video className="h-7 w-7 text-teal-600 dark:text-teal-400" />
            Live Class Management
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Configure live meeting URLs (Google Meet, Teams, Zoom) and control course-specific participant access.
          </p>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold gap-1.5 text-xs shadow-md shadow-teal-500/20"
        >
          <Plus className="h-4 w-4" />
          Schedule Live Class
        </Button>
      </div>

      {/* Tabs & Course Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={activeTab === "classes" ? "default" : "outline"}
            onClick={() => setActiveTab("classes")}
            className={`text-xs gap-1.5 ${
              activeTab === "classes"
                ? "bg-teal-600 text-white font-bold"
                : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            Live Sessions ({classes.length})
          </Button>
          <Button
            size="sm"
            variant={activeTab === "participants" ? "default" : "outline"}
            onClick={() => setActiveTab("participants")}
            className={`text-xs gap-1.5 ${
              activeTab === "participants"
                ? "bg-teal-600 text-white font-bold"
                : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Manage Participants ({participants.length})
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Label htmlFor="courseFilter" className="text-xs text-slate-500 shrink-0">
            Cohort:
          </Label>
          <select
            id="courseFilter"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="h-9 px-3 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500 w-full sm:w-64"
          >
            <option value="">All Courses &amp; Cohorts</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB 1: LIVE SESSIONS LIST */}
      {activeTab === "classes" && (
        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-900 dark:text-white">
              Scheduled Live Classes
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Only students explicitly approved in &quot;Manage Participants&quot; will see the meeting links in their dashboard
            </CardDescription>
          </CardHeader>

          <CardContent>
            {loadingClasses ? (
              <div className="space-y-3">
                <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </div>
            ) : classes.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                <Video className="h-10 w-10 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No Live Classes Scheduled for this Course
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click &quot;Schedule Live Class&quot; to configure your Google Meet, Teams, or Zoom link.
                </p>
                <Button
                  size="sm"
                  onClick={handleOpenCreateModal}
                  className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create First Class
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {classes.map((c) => (
                  <div
                    key={c.id}
                    className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {c.title}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-mono border-teal-500/40 text-teal-600 dark:text-teal-400 bg-teal-500/10"
                        >
                          {c.meetingPlatform}
                        </Badge>
                        <Badge
                          variant={c.isPublished ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {c.isPublished ? "Published" : "Draft"}
                        </Badge>
                        <Badge
                          variant={c.isActive ? "outline" : "destructive"}
                          className={`text-[10px] ${
                            c.isActive ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400" : ""
                          }`}
                        >
                          {c.isActive ? "Active" : "Archived"}
                        </Badge>
                      </div>

                      {c.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                          {c.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-teal-500" />
                          {c.scheduledDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-cyan-500" />
                          {c.startTime} {c.endTime ? `- ${c.endTime}` : ""}
                        </span>
                        <a
                          href={c.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:underline font-mono text-[11px]"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Test Meeting URL
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTogglePublished(c)}
                        className="text-xs h-8 border-slate-300 dark:border-slate-700"
                      >
                        {c.isPublished ? "Unpublish" : "Publish"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(c)}
                        className="text-xs h-8 border-slate-300 dark:border-slate-700"
                      >
                        {c.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditModal(c)}
                        className="text-xs h-8 gap-1 border-slate-300 dark:border-slate-700 text-teal-600 dark:text-teal-300"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteClass(c.id, c.title)}
                        className="text-xs h-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
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
      )}

      {/* TAB 2: MANAGE PARTICIPANTS (Course-Specific Access Control) */}
      {activeTab === "participants" && (
        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-md">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <CardTitle className="text-base text-slate-900 dark:text-white">
                    Participant Course-Specific Access Control
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Meeting URLs are strictly hidden from students until explicitly approved below
                </CardDescription>
              </div>

              {/* Bulk Actions */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleUpdateParticipantAccess(selectedUserIds, true)}
                  disabled={selectedUserIds.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  Bulk Approve ({selectedUserIds.length})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateParticipantAccess(selectedUserIds, false)}
                  disabled={selectedUserIds.length === 0}
                  className="border-red-500/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs gap-1.5"
                >
                  <UserX className="h-3.5 w-3.5" />
                  Bulk Revoke
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            {/* Search Input & Select All */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Filter participants..."
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  className="pl-8 text-xs h-9 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSelectAllParticipants}
                  className="h-8 text-xs text-teal-600 dark:text-teal-400"
                >
                  {selectedUserIds.length === filteredParticipants.length && filteredParticipants.length > 0
                    ? "Deselect All"
                    : "Select All Enrolled"}
                </Button>
                <span>
                  Approved: {participants.filter((p) => p.approved).length} / {participants.length}
                </span>
              </div>
            </div>

            {loadingParticipants ? (
              <div className="space-y-3">
                <div className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </div>
            ) : filteredParticipants.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <Users className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No Enrolled Participants Found for this Course
                </p>
                <p className="text-xs text-slate-500">
                  Students will appear here once they redeem their cohort code or are directly enrolled in Student Roster.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border rounded-xl overflow-hidden border-slate-200 dark:border-slate-800">
                {filteredParticipants.map((p) => {
                  const isSelected = selectedUserIds.includes(p.userId);
                  return (
                    <div
                      key={p.userId}
                      className={`p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-colors ${
                        isSelected
                          ? "bg-teal-50/50 dark:bg-teal-950/20"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUserIds([...selectedUserIds, p.userId]);
                            } else {
                              setSelectedUserIds(selectedUserIds.filter((id) => id !== p.userId));
                            }
                          }}
                          className="mt-0.5 sm:mt-0 rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                        />

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {p.displayName}
                            </span>
                            <Badge
                              variant={p.approved ? "default" : "outline"}
                              className={`text-[10px] ${
                                p.approved
                                  ? "bg-emerald-600 text-white"
                                  : "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                              }`}
                            >
                              {p.approved ? "✓ Live Access Approved" : "Access Pending"}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 text-slate-500 text-[11px]">
                            <span>{p.email}</span>
                            {p.phoneNumber && (
                              <span>• Tel: {p.phoneNumber}</span>
                            )}
                            <span className="font-mono text-[10px]">UID: {p.userId.substring(0, 8)}...</span>
                          </div>

                          {/* Audit trail */}
                          {p.approved && p.approvedBy && (
                            <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                              Approved by: {p.approvedBy}
                            </p>
                          )}
                          {!p.approved && p.revokedBy && (
                            <p className="text-[10px] text-red-500/80">
                              Revoked by: {p.revokedBy}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {p.approved ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateParticipantAccess([p.userId], false)}
                            className="h-7 text-xs border-red-500/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <UserX className="h-3 w-3 mr-1" />
                            Revoke Access
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateParticipantAccess([p.userId], true)}
                            className="h-7 text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold"
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            Approve Access
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CREATE / EDIT LIVE CLASS MODAL */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? "Edit Live Class" : "Schedule New Live Class"}
      >
        <form onSubmit={handleSaveClass} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="classCourse">Course Cohort</Label>
            <select
              id="classCourse"
              value={formCourseId}
              onChange={(e) => setFormCourseId(e.target.value)}
              className="w-full h-10 px-3 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              required
            >

            {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.batchName || "Batch 2026"})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="classTitle" required>
              Class Title
            </Label>
            <Input
              id="classTitle"
              type="text"
              placeholder="e.g. Week 1 Live Session: Distributed Spark Architecture"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="classPlatform" required>
                Meeting Platform
              </Label>
              <select
                id="classPlatform"
                value={formPlatform}
                onChange={(e) => setFormPlatform(e.target.value as MeetingPlatform)}
                className="w-full h-10 px-3 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              >
                <option value="google-meet">Google Meet</option>
                <option value="microsoft-teams">Microsoft Teams</option>
                <option value="zoom">Zoom</option>
                <option value="other">Other Platform</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="classDate" required>
                Scheduled Date (YYYY-MM-DD)
              </Label>
              <Input
                id="classDate"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="classMeetingUrl" required>
              Meeting URL
            </Label>
            <Input
              id="classMeetingUrl"
              type="url"
              placeholder="https://meet.google.com/xxx-xxxx-xxx or https://teams.microsoft.com/..."
              value={formMeetingUrl}
              onChange={(e) => setFormMeetingUrl(e.target.value)}
              required
            />
            <p className="text-[11px] text-slate-500">
              Validated URL format. Protected and delivered only to approved participants.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="classStart" required>
                Start Time
              </Label>
              <Input
                id="classStart"
                type="text"
                placeholder="10:00 AM"
                value={formStartTime}
                onChange={(e) => setFormStartTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="classEnd">End Time (Optional)</Label>
              <Input
                id="classEnd"
                type="text"
                placeholder="12:00 PM"
                value={formEndTime}
                onChange={(e) => setFormEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="classDesc">Class Description / Agenda (Optional)</Label>
            <textarea
              id="classDesc"
              rows={2}
              placeholder="Bring your questions on PySpark memory optimization and lab assignments..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={formIsPublished}
                onChange={(e) => setFormIsPublished(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
              />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Published (Visible to approved students)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
              />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Active Session
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
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
                  Saving...
                </>
              ) : (
                <>
                  <Video className="h-3.5 w-3.5" />
                  {editingClass ? "Save Changes" : "Schedule Class"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

