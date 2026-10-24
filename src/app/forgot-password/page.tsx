"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth-context";
import { useToast } from "@/components/ui/toast";
import { Navbar } from "@/components/navigation/navbar";
import { Footer } from "@/components/navigation/footer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { KeyRound, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await resetPassword(email);
      setIsSent(true);
      toastSuccess("Email sent", "Password reset instructions sent to your inbox.");
    } catch (err: any) {
      console.error("Password reset error:", err);
      let message = "Could not send reset link. Please verify your email.";
      if (err.code === "auth/user-not-found") {
        message = "No account found with this email address.";
      }
      setError(message);
      toastError("Reset failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#071527] dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-xl backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-2">
                <KeyRound className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl text-slate-900 dark:text-white">Reset Your Password</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                Enter your email address and we&apos;ll send you a link to reset your password
              </CardDescription>
            </CardHeader>

            <CardContent>
              {isSent ? (
                <div className="text-center space-y-4 py-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">Check Your Inbox</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    We have dispatched password reset instructions to{" "}
                    <span className="text-teal-600 dark:text-teal-400 font-mono font-medium">{email}</span>.
                    Please check your spam or junk folder if you don&apos;t see it shortly.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setIsSent(false)}
                    className="border-slate-300 dark:border-slate-700 text-xs"
                  >
                    Try another email address
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-500 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="email" required>
                      Account Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold h-10"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending reset link...
                      </span>
                    ) : (
                      "Send Reset Instructions"
                    )}
                  </Button>
                </form>
              )}
            </CardContent>

            <CardFooter className="pt-2 border-t border-slate-200 dark:border-slate-800/80 justify-center text-xs text-slate-500 dark:text-slate-400">
              <Link href="/login" className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Sign In
              </Link>
            </CardFooter>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

