"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/firebase/auth-context";
import { useToast } from "@/components/ui/toast";
import { loginSchema, type LoginFormData } from "@/lib/validations";
import { Navbar } from "@/components/navigation/navbar";
import { Footer } from "@/components/navigation/footer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { GraduationCap, Loader2, ArrowRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const { signInWithEmail, signInWithGoogle, user, isAdmin } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // If already logged in, redirect
  if (user) {
    router.push(isAdmin ? "/admin" : redirectUrl);
    return null;
  }

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      await signInWithEmail(data.email, data.password);
      toastSuccess("Welcome back!", "Successfully signed in.");
      router.push(redirectUrl);
    } catch (err: any) {
      console.error("Sign in error:", err);
      let message = "Invalid email or password.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        message = "Incorrect email address or password.";
      } else if (err.code === "auth/too-many-requests") {
        message = "Too many failed attempts. Please try again later or reset your password.";
      } else if (err.code === "auth/user-disabled") {
        message = "This account has been disabled. Please contact support.";
      }
      setAuthError(message);
      toastError("Authentication failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setAuthError(null);

    try {
      await signInWithGoogle();
      toastSuccess("Welcome!", "Signed in with Google.");
      router.push(redirectUrl);
    } catch (err: any) {
      console.error("Google sign in error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        return;
      }
      let message = "Could not sign in with Google. Please try again.";
      if (err.code === "auth/unauthorized-domain") {
        message = "This domain is not authorized in Firebase Authentication. Please check Firebase authorized domains.";
      } else if (err.code === "auth/popup-blocked") {
        message = "The sign-in popup was blocked by your browser. Please allow popups for this site.";
      } else if (err.message && !err.message.includes("Firebase:")) {
        message = err.message;
      }
      setAuthError(message);
      toastError("Google Sign-In failed", message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#071527] dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 rounded-xl bg-teal-500/10 border border-teal-500/30 items-center justify-center text-teal-600 dark:text-teal-400 mb-2">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Sign In to TiBen AI Academy
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Access your Data Horizon live sessions, recordings, and resources
            </p>
          </div>

          <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-xl backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Student / Admin Login</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Choose your preferred authentication method
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Google Sign In Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
                className="w-full h-11 border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800 dark:text-slate-100 font-medium flex items-center justify-center gap-3"
              >
                {isGoogleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-teal-500 dark:text-teal-400" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </Button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                <span className="bg-white dark:bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-500 shrink-0">
                  Or continue with email
                </span>
                <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              </div>

              {authError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                  {authError}
                </div>
              )}

              {/* Email Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" required>
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@example.com"
                    autoComplete="email"
                    error={errors.email?.message}
                    {...register("email")}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" required>
                      Password
                    </Label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-teal-400 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    error={errors.password?.message}
                    {...register("password")}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold h-10 mt-2"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Sign In
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-col gap-2 text-center text-xs text-slate-600 dark:text-slate-400">
              <p>
                Don&apos;t have an account yet?{" "}
                <Link href="/register" className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                  Register here
                </Link>
              </p>
              <p>
                Have an enrollment code?{" "}
                <Link href="/redeem" className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline">
                  Redeem code directly
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
          <Loader2 className="h-8 w-8 text-teal-400 animate-spin mb-2" />
          <p className="text-xs text-slate-400">Loading sign in...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
