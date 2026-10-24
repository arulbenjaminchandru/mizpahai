"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/firebase/auth-context";
import { useToast } from "@/components/ui/toast";
import { registerSchema, type RegisterFormData } from "@/lib/validations";
import { Navbar } from "@/components/navigation/navbar";
import { Footer } from "@/components/navigation/footer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { GraduationCap, Loader2, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle, user } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // If already logged in, redirect to dashboard or redeem
  if (user) {
    router.push("/dashboard");
    return null;
  }

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      await signUpWithEmail(data.email, data.password, data.displayName);
      toastSuccess("Account created!", "Welcome to TiBen AI Academy.");
      router.push("/redeem"); // Prompt newly registered students to enter enrollment code
    } catch (err: any) {
      console.error("Registration error:", err);
      let message = "Could not create account. Please try again.";
      if (err.code === "auth/email-already-in-use") {
        message = "An account with this email address already exists. Please sign in.";
      } else if (err.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (err.code === "auth/weak-password") {
        message = "Password is too weak. Please use at least 8 characters with numbers and letters.";
      }
      setAuthError(message);
      toastError("Registration failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setAuthError(null);

    try {
      await signInWithGoogle();
      toastSuccess("Account connected!", "Signed in with Google.");
      router.push("/redeem");
    } catch (err: any) {
      console.error("Google sign up error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        const message = "Could not sign in with Google. Please try again.";
        setAuthError(message);
        toastError("Google Sign-In failed", message);
      }
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
              Create Your Account
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Join TiBen AI Academy to access your coursework and live cohorts
            </p>
          </div>

          <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-xl backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Student Registration</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Register to redeem enrollment codes and access courses
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignUp}
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
                <span>Sign up with Google</span>
              </Button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                <span className="bg-white dark:bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-500 shrink-0">
                  Or register with email
                </span>
                <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              </div>

              {authError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                  {authError}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
                <div className="space-y-1">
                  <Label htmlFor="displayName" required>
                    Full Name
                  </Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Jane Doe"
                    autoComplete="name"
                    error={errors.displayName?.message}
                    {...register("displayName")}
                  />
                </div>

                <div className="space-y-1">
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

                <div className="space-y-1">
                  <Label htmlFor="password" required>
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min 8 chars (uppercase, lowercase, number)"
                    autoComplete="new-password"
                    error={errors.password?.message}
                    {...register("password")}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirmPassword" required>
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    error={errors.confirmPassword?.message}
                    {...register("confirmPassword")}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold h-10 mt-3"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Create Account
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-col gap-2 text-center text-xs text-slate-600 dark:text-slate-400">
              <p>
                Already have an account?{" "}
                <Link href="/login" className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                  Sign in
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

