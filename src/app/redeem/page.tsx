"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/firebase/auth-context";
import { useToast } from "@/components/ui/toast";
import { enrollmentRedemptionSchema, type EnrollmentRedemptionFormData } from "@/lib/validations";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Navbar } from "@/components/navigation/navbar";
import { Footer } from "@/components/navigation/footer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { KeyRound, Loader2, CheckCircle2, ArrowRight, BookOpen, ShieldCheck } from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function RedeemCodePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{
    courseId: string;
    courseName: string;
    batchName: string;
    alreadyEnrolled?: boolean;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EnrollmentRedemptionFormData>({
    resolver: zodResolver(enrollmentRedemptionSchema),
  });

  const onSubmit = async (data: EnrollmentRedemptionFormData) => {
    if (!user) return;
    setIsLoading(true);
    setErrorMessage(null);

    const targetCode = data.code.trim().toUpperCase();

    try {
      // 1. Force refresh token for authoritative permissions
      const token = await user.getIdToken(true);

      // 2. Attempt redemption via serverless API
      let res: Response | null = null;
      let result: any = null;

      try {
        res = await fetch("/api/enroll/redeem", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ code: targetCode }),
        });

        if (res) {
          const text = await res.text();
          result = text ? JSON.parse(text) : null;
        }
      } catch (networkOrJsonErr) {
        console.warn("API redemption response issue, falling back to direct Firestore:", networkOrJsonErr);
      }

      // If server API successfully processed redemption
      if (res && res.ok && result?.success) {
        setRedeemResult({
          courseId: result.courseId,
          courseName: result.courseName,
          batchName: result.batchName,
        });
        toastSuccess("Enrolled successfully!", result.message);
        return;
      }

      // If server returned a definitive validation error (e.g. bad format, already used)
      if (res && res.status === 400 && result?.error && !result.error.toLowerCase().includes("internal")) {
        throw new Error(result.error);
      }

      // 3. Resilient Direct Client Fallback via Firestore
      const q = query(
        collection(db, "enrollmentCodes"),
        where("code", "==", targetCode)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        throw new Error("Invalid enrollment code. Please check your spelling and try again.");
      }

      const codeDoc = snap.docs[0];
      const codeData = codeDoc.data();
      const courseId = codeData.courseId;
      const batchName = codeData.batchName || "Standard Cohort";

      // Fetch course name
      let courseName = "Course";
      try {
        const cSnap = await getDoc(doc(db, "courses", courseId));
        if (cSnap.exists()) {
          courseName = cSnap.data()?.name || "Course";
        }
      } catch (cErr) {
        console.warn("Could not fetch course title:", cErr);
      }

      // Check if user is already enrolled
      const enrollmentId = `${user.uid}_${courseId}`;
      const existingEnrollment = await getDoc(doc(db, "enrollments", enrollmentId));
      if (existingEnrollment.exists()) {
        setRedeemResult({
          courseId,
          courseName,
          batchName,
          alreadyEnrolled: true,
        });
        toastSuccess("Already Enrolled", `You already have active access to "${courseName}". Welcome back!`);
        return;
      }

      // Check status
      if (codeData.status === "revoked") {
        throw new Error("This enrollment code has been revoked by the administrator.");
      }

      // Check expiration date
      if (codeData.expiresAt) {
        const expDate = typeof codeData.expiresAt.toDate === "function"
          ? codeData.expiresAt.toDate()
          : new Date((codeData.expiresAt.seconds || codeData.expiresAt._seconds) * 1000);
        if (new Date() > expDate) {
          throw new Error("This enrollment code has expired.");
        }
      }

      // Check redemption capacity
      const maxRedemptions = codeData.maxRedemptions || 1;
      const currentRedemptions = codeData.currentRedemptions || 0;
      if (currentRedemptions >= maxRedemptions) {
        throw new Error("This enrollment code has already reached its maximum redemptions limit.");
      }

      // Check if user previously redeemed this specific code
      const redeemedBy: string[] = codeData.redeemedBy || [];
      if (redeemedBy.includes(user.uid)) {
        throw new Error("You have already redeemed this code.");
      }

      // Write enrollment record
      await setDoc(doc(db, "enrollments", enrollmentId), {
        userId: user.uid,
        courseId,
        batchName,
        enrollmentCodeId: codeDoc.id,
        status: "active",
        enrolledAt: serverTimestamp(),
      });

      // Update code redemptions
      const nextRedemptions = currentRedemptions + 1;
      await updateDoc(doc(db, "enrollmentCodes", codeDoc.id), {
        currentRedemptions: nextRedemptions,
        redeemedBy: arrayUnion(user.uid),
        status: nextRedemptions >= maxRedemptions ? "expired" : codeData.status,
      });

      setRedeemResult({
        courseId,
        courseName,
        batchName,
      });

      toastSuccess(
        "Enrolled successfully!",
        `Congratulations! You have been successfully enrolled in "${courseName}".`
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to redeem code");
      toastError("Redemption Failed", err.message || "Failed to redeem code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#071527] dark:text-slate-100 transition-colors">
        <Navbar />

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md space-y-6">
            <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-2xl backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-2">
                  <KeyRound className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl text-slate-900 dark:text-slate-100">Redeem Enrollment Code</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">
                  Enter the unique access code provided by your TiBen AI Academy instructor
                </CardDescription>
              </CardHeader>

              <CardContent>
                {redeemResult ? (
                  <div className="text-center space-y-4 py-4 animate-in fade-in-50">
                    <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {redeemResult.alreadyEnrolled ? "Already Enrolled!" : "Enrollment Confirmed!"}
                      </h3>
                      <p className="text-sm text-teal-600 dark:text-teal-400 font-medium">
                        {redeemResult.courseName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Batch: {redeemResult.batchName}
                      </p>
                      {redeemResult.alreadyEnrolled && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium pt-1">
                          You already have lifetime access to this classroom.
                        </p>
                      )}
                    </div>

                    <div className="pt-4 flex flex-col gap-2">
                      <Link href={`/courses/${redeemResult.courseId}`} className="w-full">
                        <Button className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold gap-2">
                          {redeemResult.alreadyEnrolled ? "Open Course Classroom" : "Start Learning"}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href="/dashboard" className="w-full">
                        <Button variant="outline" className="w-full border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                          Go to Dashboard
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {errorMessage && (
                      <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-500 dark:text-red-400 leading-relaxed">
                        {errorMessage}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="code" required>
                        Enrollment Code
                      </Label>
                      <Input
                        id="code"
                        type="text"
                        placeholder="e.g. DH-2026-AB12CD"
                        className="font-mono text-center text-base tracking-wider uppercase"
                        autoComplete="off"
                        error={errors.code?.message}
                        {...register("code", {
                          onChange: (e) => {
                            setValue("code", e.target.value.toUpperCase());
                          },
                        })}
                      />
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Codes are format-insensitive and cryptographically authenticated.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold h-11"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Validating code...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Unlock Course Access
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>

              <CardFooter className="pt-2 border-t border-slate-200 dark:border-slate-800/80 justify-center">
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-500 dark:text-teal-400" />
                  <span>Verified TiBen AI Academy student access</span>
                </div>
              </CardFooter>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </AuthGuard>
  );
}

