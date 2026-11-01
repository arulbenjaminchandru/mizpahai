"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth-context";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Navbar } from "@/components/navigation/navbar";
import { Footer } from "@/components/navigation/footer";
import { UpdateMobileModal } from "@/components/profile/UpdateMobileModal";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Enrollment, Course } from "@/types";
import {
  User as UserIcon,
  Mail,
  Shield,
  Calendar,
  BookOpen,
  LogOut,
  KeyRound,
  ExternalLink,
  CheckCircle,
  Phone,
  PhoneCall,
  Clock,
  Sparkles,
} from "lucide-react";

export default function ProfilePage() {
  const { user, userProfile, isAdmin, signOut } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Record<string, Course>>({});
  const [loading, setLoading] = useState(true);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);

  useEffect(() => {
    async function fetchUserEnrollments() {
      if (!user) return;
      try {
        const q = query(
          collection(db, "enrollments"),
          where("userId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const userEnrollments: Enrollment[] = [];
        snapshot.forEach((doc) => {
          userEnrollments.push({ id: doc.id, ...doc.data() } as Enrollment);
        });
        setEnrollments(userEnrollments);

        // Fetch corresponding course details
        if (userEnrollments.length > 0) {
          const courseMap: Record<string, Course> = {};
          const coursesSnapshot = await getDocs(collection(db, "courses"));
          coursesSnapshot.forEach((doc) => {
            courseMap[doc.id] = { id: doc.id, ...doc.data() } as Course;
          });
          setCourses(courseMap);
        }
      } catch (err) {
        console.error("Error fetching enrollments:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserEnrollments();
  }, [user]);

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

  const hasPhone = Boolean(userProfile?.phoneNumber && userProfile.phoneNumber.trim().length > 0);

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#071527] dark:text-slate-100 transition-colors">
        <Navbar />

        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Student Profile &amp; Settings
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Manage your credentials, view course authorizations, and update contact information.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: User Card */}
            <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 h-fit shadow-md">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-500 p-0.5 mb-3">
                  <div className="h-full w-full rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                    <UserIcon className="h-10 w-10 text-teal-600 dark:text-teal-400" />
                  </div>
                </div>
                <CardTitle className="text-lg text-slate-900 dark:text-white">
                  {userProfile?.displayName || user?.displayName || "Learner"}
                </CardTitle>
                <CardDescription className="text-xs break-all text-slate-500 dark:text-slate-400">
                  {user?.email}
                </CardDescription>
                <div className="pt-2 flex flex-wrap justify-center gap-1.5">
                  <Badge variant={isAdmin ? "default" : "secondary"} className="uppercase text-[10px]">
                    {isAdmin ? "Administrator" : "Enrolled Student"}
                  </Badge>
                  <Badge
                    variant={hasPhone ? "outline" : "secondary"}
                    className={`text-[10px] ${
                      hasPhone
                        ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10"
                    }`}
                  >
                    {hasPhone ? "✓ Profile Complete" : "Mobile Pending"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3.5 pt-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Phone className="h-4 w-4 text-teal-500 shrink-0" />
                    <span className="truncate font-mono">
                      {userProfile?.phoneNumber || "No mobile added"}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsPhoneModalOpen(true)}
                    className="h-6 px-2 text-[11px] text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/20"
                  >
                    Edit
                  </Button>
                </div>

                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span>Joined: {regDateFormatted}</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <Shield className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="font-mono text-[11px]">UID: {user?.uid.substring(0, 12)}...</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <BookOpen className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span>Enrolled Courses: {loading ? "..." : enrollments.length}</span>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <Link href="/redeem" className="w-full block">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-teal-500/40 text-teal-600 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/20 gap-2"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      Redeem Another Code
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut()}
                    className="w-full text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-300 gap-2"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Right: Enrolled Courses */}
            <div className="md:col-span-2 space-y-6">
              <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-slate-900 dark:text-white">Authorized Courses</CardTitle>
                      <CardDescription className="text-slate-500 dark:text-slate-400">
                        Courses unlocked and linked to your student identity
                      </CardDescription>
                    </div>
                    <Link href="/redeem">
                      <Button size="sm" className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold gap-1.5 text-xs">
                        <KeyRound className="h-3.5 w-3.5" />
                        Add Course
                      </Button>
                    </Link>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {loading ? (
                    <div className="space-y-3">
                      <div className="h-20 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
                      <div className="h-20 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    </div>
                  ) : enrollments.length === 0 ? (
                    <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                      <BookOpen className="h-8 w-8 text-slate-400 dark:text-slate-600 mx-auto" />
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        No Active Course Enrollments
                      </h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        You have not redeemed any course enrollment code yet. Contact your TiBen AI Academy instructor to obtain your access code.
                      </p>
                      <Link href="/redeem">
                        <Button size="sm" className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs gap-1.5 mt-2">
                          <KeyRound className="h-3.5 w-3.5" />
                          Redeem Code
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                      {enrollments.map((enr) => {
                        const course = courses[enr.courseId];
                        return (
                          <div
                            key={enr.id}
                            className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                                  {course?.name || "Data Horizon Training"}
                                </h4>
                                <Badge variant="outline" className="text-[10px] text-teal-600 dark:text-teal-400 border-teal-500/30">
                                  {enr.batchName || course?.batchName || "Batch 2026"}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                                {course?.description || "Curriculum recordings, notebooks, and architectural diagrams."}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                Instructor: {course?.instructorName || "Arul Benjamin"}
                              </p>
                            </div>

                            <Link href={`/courses/${enr.courseId}`} className="shrink-0">
                              <Button size="sm" className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs gap-1.5">
                                Enter Classroom
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <Footer />

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
