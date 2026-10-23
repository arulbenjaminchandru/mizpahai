"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/firebase/auth-context";
import { useToast } from "@/components/ui/toast";
import { enrollmentCodeSchema, type EnrollmentCodeFormData } from "@/lib/validations";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  ShieldAlert,
  Loader2,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import type { Course, EnrollmentCode } from "@/types";

interface ExtendedCode extends EnrollmentCode {
  maskedCode?: string;
}

export default function AdminEnrollmentCodesPage() {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [codes, setCodes] = useState<ExtendedCode[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justGeneratedCode, setJustGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EnrollmentCodeFormData>({
    resolver: zodResolver(enrollmentCodeSchema),
    defaultValues: {
      prefix: "DH",
      batchName: "2026",
      maxRedemptions: 1,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
  });

  const fetchCodes = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken(true);
      const res = await fetch("/api/admin/enrollment-codes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCodes(data.codes || []);
      }
    } catch (err) {
      console.error("Error fetching codes:", err);
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
    } catch (err) {
      console.error("Error fetching courses:", err);
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
    }
  };

  useEffect(() => {
    fetchCodes();
    fetchCourses();
  }, [user]);

  const onSubmit = async (data: EnrollmentCodeFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/enrollment-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to generate code");

      setJustGeneratedCode(result.generatedCode);
      toastSuccess("Code generated", "Share this code with the authorized student.");
      reset();
      fetchCodes();
    } catch (err: any) {
      toastError("Generation failed", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeCode = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this code? It can no longer be redeemed.")) {
      return;
    }
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/enrollment-codes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status: "revoked" }),
      });
      if (res.ok) {
        toastSuccess("Code Revoked", "Enrollment key deactivated.");
        fetchCodes();
      }
    } catch (err: any) {
      toastError("Revocation failed", err.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toastSuccess("Copied!", "Code copied to clipboard.");
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Enrollment Key Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Generate and monitor single-use or multi-use cryptographic enrollment codes.
          </p>
        </div>
        <Button
          onClick={() => {
            setJustGeneratedCode(null);
            setIsModalOpen(true);
          }}
          className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold gap-1.5 text-xs"
        >
          <Plus className="h-4 w-4" />
          Generate New Code
        </Button>
      </div>

      {/* Prominent Banner for Just-Generated Code */}
      {justGeneratedCode && (
        <Card className="border-teal-500/50 bg-teal-950/30 p-4 shadow-xl animate-in fade-in-50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-400" />
                <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider">
                  Newly Generated Access Code
                </span>
              </div>
              <p className="text-lg font-mono font-bold text-white tracking-wider">
                {justGeneratedCode}
              </p>
              <p className="text-[11px] text-slate-400">
                Copy this code now. For security, full keys are masked in database listings.
              </p>
            </div>
            <Button
              onClick={() => copyToClipboard(justGeneratedCode)}
              className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs gap-1.5 shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Code
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Codes Table */}
      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-md">
        <CardHeader>
          <CardTitle className="text-base text-slate-900 dark:text-white">Active &amp; Expired Keys</CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Review redemption limits, usage counts, and expiration dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <div className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
            </div>
          ) : codes.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <KeyRound className="h-8 w-8 text-slate-400 dark:text-slate-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No Codes Generated Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Generate unique registration codes to distribute to your students.
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                size="sm"
                className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs"
              >
                Generate First Code
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {codes.map((code) => {
                const course = courses.find((c) => c.id === code.courseId);

                return (
                  <div
                    key={code.id}
                    className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-teal-300">
                          {code.maskedCode || "DH-••••••"}
                        </span>
                        <Badge
                          variant={
                            code.status === "active"
                              ? "default"
                              : code.status === "revoked"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {code.status}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] text-slate-400">
                          {code.batchName || "Standard"}
                        </Badge>
                      </div>

                      <p className="text-slate-300 font-medium">
                        Course: {course?.name || "Assigned Course"}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-slate-400">
                        <span>
                          Redemptions:{" "}
                          <strong className="text-white">
                            {code.currentRedemptions || 0} / {code.maxRedemptions || 1}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Created By Admin UID: {code.createdBy?.substring(0, 8)}...
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {code.status === "active" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRevokeCode(code.id)}
                          className="h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/20"
                        >
                          Revoke Code
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

      {/* Generate Code Dialog */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate Enrollment Code"
        description="Create cryptographically secure access keys linked to a specific cohort"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="courseId" required>
              Target Course
            </Label>
            <select
              id="courseId"
              className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
              {...register("courseId")}
            >
              <option value="">Select a course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.batchName})
                </option>
              ))}
            </select>
            {errors.courseId && (
              <p className="text-xs text-red-400">{errors.courseId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="prefix" required>
                Code Prefix
              </Label>
              <Input
                id="prefix"
                placeholder="DH"
                error={errors.prefix?.message}
                {...register("prefix")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="batchName" required>
                Batch Tag
              </Label>
              <Input
                id="batchName"
                placeholder="2026"
                error={errors.batchName?.message}
                {...register("batchName")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="maxRedemptions" required>
                Max Redemptions
              </Label>
              <Input
                id="maxRedemptions"
                type="number"
                min={1}
                placeholder="1 (single student)"
                error={errors.maxRedemptions?.message}
                {...register("maxRedemptions", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="expiresAt" required>
                Expiration Date
              </Label>
              <Input
                id="expiresAt"
                type="date"
                error={errors.expiresAt?.message}
                {...register("expiresAt")}
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
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
                  Generating...
                </span>
              ) : (
                "Generate Code"
              )}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

