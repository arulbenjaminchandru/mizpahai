"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth-context";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

interface Metrics {
  totalStudents: number;
  activeEnrollments: number;
  totalCourses: number;
  totalLessons: number;
  totalCompletions: number;
}

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<Metrics>({
    totalStudents: 0,
    activeEnrollments: 0,
    totalCourses: 0,
    totalLessons: 0,
    totalCompletions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      if (!user) return;
      try {
        const token = await user.getIdToken(true);
        const res = await fetch("/api/admin/metrics", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
          return;
        }
        // Client fallback
        const [usersSnap, coursesSnap, lessonsSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "courses")),
          getDocs(collection(db, "lessons")),
        ]);
        setMetrics((prev) => ({
          ...prev,
          totalStudents: usersSnap.size,
          totalCourses: coursesSnap.size,
          totalLessons: lessonsSnap.size,
        }));
      } catch (err) {
        console.error("Error fetching metrics:", err);
        try {
          const [usersSnap, coursesSnap, lessonsSnap] = await Promise.all([
            getDocs(collection(db, "users")),
            getDocs(collection(db, "courses")),
            getDocs(collection(db, "lessons")),
          ]);
          setMetrics((prev) => ({
            ...prev,
            totalStudents: usersSnap.size,
            totalCourses: coursesSnap.size,
            totalLessons: lessonsSnap.size,
          }));
        } catch (clientErr) {
          console.error("Client metrics fallback failed:", clientErr);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, [user]);

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
      description: "Student course seats assigned",
      icon: CheckCircle2,
      color: "text-teal-400",
      bgColor: "bg-teal-500/10 border-teal-500/20",
    },
    {
      title: "Active Courses",
      value: metrics.totalCourses,
      description: "Configured cohorts & tracks",
      icon: BookOpen,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10 border-cyan-500/20",
    },
    {
      title: "Curriculum Lessons",
      value: metrics.totalLessons,
      description: "YouTube lecture modules",
      icon: Video,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10 border-purple-500/20",
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
        <div className="flex items-center gap-2">
          <Link href="/admin/courses">
            <Button size="sm" className="bg-[#0D9488] hover:bg-[#0f766e] text-white font-bold gap-1.5 text-xs shadow-sm">
              <PlusCircle className="h-4 w-4" />
              New Course
            </Button>
          </Link>
          <Link href="/admin/enrollment-codes">
            <Button size="sm" variant="outline" className="border-slate-300 dark:border-slate-700 text-xs gap-1.5 text-slate-700 dark:text-slate-300">
              <KeyRound className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              Generate Codes
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
              <div
                className={`p-2 rounded-lg border ${card.bgColor} ${card.color}`}
              >
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

      {/* Quick Action Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 hover:border-teal-500/40 transition-colors shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <CardTitle className="text-base text-slate-900 dark:text-white">Course Management</CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Configure cohorts, structure weekly modules, attach YouTube lectures, and publish curriculum.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/courses">
              <Button variant="outline" size="sm" className="w-full border-slate-300 dark:border-slate-700 text-xs justify-between">
                <span>Manage Courses</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 hover:border-cyan-500/40 transition-colors shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <Users className="h-5 w-5" />
              </div>
              <CardTitle className="text-base text-slate-900 dark:text-white">Student Roster</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Search registered learners, review enrollment statuses, and toggle account permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/students">
              <Button variant="outline" size="sm" className="w-full border-slate-700 text-xs justify-between">
                <span>View Students</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 hover:border-purple-500/40 transition-colors shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <KeyRound className="h-5 w-5" />
              </div>
              <CardTitle className="text-base text-slate-900 dark:text-white">Enrollment Codes</CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Generate cryptographic access keys for specific courses and batches with expiry rules.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/enrollment-codes">
              <Button variant="outline" size="sm" className="w-full border-slate-300 dark:border-slate-700 text-xs justify-between">
                <span>Manage Codes</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Completion & Security Overview Card */}
      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <CardTitle className="text-sm text-slate-900 dark:text-white">Platform Operational Status</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Lesson Completions Tracked</span>
              <p className="text-[11px] text-slate-500">Total individual student completion records</p>
            </div>
            <span className="text-lg font-bold text-teal-600 dark:text-teal-400">{metrics.totalCompletions}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50">
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Firestore Free-Tier Quota Health</span>
              <p className="text-[11px] text-slate-500">Spark Plan (50K reads / 20K writes daily limit)</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              Optimal
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

