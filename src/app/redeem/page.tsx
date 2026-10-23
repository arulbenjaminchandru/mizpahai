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

export default function RedeemCodePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{
    courseId: string;
    courseName: string;
    batchName: string;
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

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/enroll/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: data.code.trim().toUpperCase() }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to redeem code");
      }

      setRedeemResult({
        courseId: result.courseId,
        courseName: result.courseName,
        batchName: result.batchName,
      });

      toastSuccess("Enrolled successfully!", result.message);
    } catch (err: any) {
      setErrorMessage(err.message);
      toastError("Redemption Failed", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
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
                  Enter the unique access code provided by your Mizpah AI instructor
                </CardDescription>
              </CardHeader>

              <CardContent>
                {redeemResult ? (
                  <div className="text-center space-y-4 py-4 animate-in fade-in-50">
                    <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Enrollment Confirmed!</h3>
                      <p className="text-sm text-teal-600 dark:text-teal-400 font-medium">
                        {redeemResult.courseName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Batch: {redeemResult.batchName}
                      </p>
                    </div>

                    <div className="pt-4 flex flex-col gap-2">
                      <Link href={`/courses/${redeemResult.courseId}`} className="w-full">
                        <Button className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold gap-2">
                          Start Learning
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
                  <span>Verified Mizpah AI student access</span>
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

