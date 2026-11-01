"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/firebase/auth-context";
import { useToast } from "@/components/ui/toast";
import {
  studentRegisterSchema,
  formatToE164,
  type StudentRegisterFormData,
} from "@/lib/validations";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Course } from "@/types";
import { Navbar } from "@/components/navigation/navbar";
import { Footer } from "@/components/navigation/footer";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Loader2,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Phone,
  BookOpen,
} from "lucide-react";

const COUNTRY_CODES = [
  { code: "+91", label: "🇮🇳 +91 (India)" },
  { code: "+1", label: "🇺🇸 +1 (US / Canada)" },
  { code: "+44", label: "🇬🇧 +44 (UK)" },
  { code: "+65", label: "🇸🇬 +65 (Singapore)" },
  { code: "+971", label: "🇦🇪 +971 (UAE)" },
  { code: "+61", label: "🇦🇺 +61 (Australia)" },
  { code: "+49", label: "🇩🇪 +49 (Germany)" },
  { code: "+33", label: "🇫🇷 +33 (France)" },
  { code: "+60", label: "🇲🇾 +60 (Malaysia)" },
  { code: "+966", label: "🇸🇦 +966 (Saudi Arabia)" },
  { code: "+974", label: "🇶🇦 +974 (Qatar)" },
  { code: "+353", label: "🇮🇪 +353 (Ireland)" },
  { code: "+64", label: "🇳🇿 +64 (New Zealand)" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle, user, loading } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState("+91");
  const [instagramFollowed, setInstagramFollowed] = useState(false);
  const [linkedinFollowed, setLinkedinFollowed] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<StudentRegisterFormData>({
    resolver: zodResolver(studentRegisterSchema),
    defaultValues: {
      countryCode: "+91",
      instagramFollowed: false,
      linkedinFollowed: false,
    },
  });

  // Load available published courses
  useEffect(() => {
    async function loadCourses() {
      try {
        const q = query(collection(db, "courses"), where("isPublished", "==", true));
        const snap = await getDocs(q);
        const list: Course[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Course));
        setCourses(list);
        if (list.length > 0) {
          setValue("selectedCourseId", list[0].id);
        }
      } catch (err) {
        console.warn("Could not load published courses:", err);
      }
    }
    loadCourses();
  }, [setValue]);

  // If already logged in, redirect via useEffect (prevent render-phase navigation)
  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const onSubmit = async (data: StudentRegisterFormData) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const e164Phone = formatToE164(data.countryCode || "+91", data.phoneNumber);
      await signUpWithEmail(
        data.email,
        data.password,
        data.displayName,
        e164Phone,
        data.countryCode || "+91",
        data.selectedCourseId,
        instagramFollowed,
        linkedinFollowed
      );
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
      const signedInUser = await signInWithGoogle();
      if (signedInUser) {
        toastSuccess("Account connected!", "Signed in with Google.");
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Google sign up error:", err);
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
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

  if (loading || user) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#071527] dark:text-slate-100 transition-colors">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#071527] dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 rounded-xl bg-teal-500/10 border border-teal-500/30 items-center justify-center text-teal-600 dark:text-teal-400 mb-2">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Create Your Student Account
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Join TiBen AI Academy to access live cohorts, lecture recordings, and lab resources
            </p>
          </div>

          <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-xl backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Student Registration</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Register with your official details to receive course access keys and class updates
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
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
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  <p className="text-[11px] text-slate-500">
                    Use the same email you provided during enrollment for Google Drive access.
                  </p>
                </div>

                {/* Mobile Number Collection (Mandatory) */}
                <div className="space-y-1">
                  <Label htmlFor="phoneNumber" required>
                    Mobile Number (For Course Announcements &amp; Batch Updates)
                  </Label>
                  <div className="flex gap-2">
                    <select
                      className="w-36 h-10 px-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      value={selectedCountryCode}
                      onChange={(e) => {
                        setSelectedCountryCode(e.target.value);
                        setValue("countryCode", e.target.value);
                      }}
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex-1">
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="9876543210"
                        autoComplete="tel"
                        error={errors.phoneNumber?.message}
                        {...register("phoneNumber")}
                      />
                    </div>
                  </div>
                  {errors.phoneNumber && (
                    <p className="text-xs text-red-500 font-medium">
                      {errors.phoneNumber.message}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500">
                    Default: India (+91). Number stored in standard E.164 format.
                  </p>
                </div>

                {/* Optional Selected Course Selection */}
                {courses.length > 0 && (
                  <div className="space-y-1">
                    <Label htmlFor="selectedCourseId">
                      Interested / Enrolled Course
                    </Label>
                    <select
                      id="selectedCourseId"
                      className="w-full h-10 px-3 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      {...register("selectedCourseId")}
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.batchName || "Active Cohort"})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

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

                {/* ─── Social Media Follow Sections ───────────────────────────────── */}
                <div className="pt-2 space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Connect With Us
                  </span>

                  {/* 1. Instagram Follow Card */}
                  <div className="p-3.5 rounded-xl border border-pink-500/20 bg-gradient-to-r from-pink-500/5 via-rose-500/5 to-transparent dark:bg-slate-800/40 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            Follow Tiben AI Academy on Instagram
                          </h4>
                          <span className="text-[11px] text-pink-600 dark:text-pink-400 font-medium">
                            @tibenaiacademy
                          </span>
                        </div>
                      </div>

                      <a
                        href="https://www.instagram.com/tibenaiacademy/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0"
                      >
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-[11px] border-pink-500/30 text-pink-600 dark:text-pink-400 hover:bg-pink-500/10 gap-1"
                        >
                          <span>Follow on Instagram</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Stay connected with @tibenaiacademy for free learning resources, AI updates, course announcements, and upcoming live sessions.
                    </p>
                    <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                      <input
                        type="checkbox"
                        checked={instagramFollowed}
                        onChange={(e) => setInstagramFollowed(e.target.checked)}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                      />
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">
                        I&apos;ve followed Tiben AI Academy on Instagram
                      </span>
                    </label>
                  </div>

                  {/* 2. LinkedIn Follow Card */}
                  <div className="p-3.5 rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-500/5 via-sky-500/5 to-transparent dark:bg-slate-800/40 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-[#0A66C2] flex items-center justify-center text-white shrink-0 shadow-sm">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            Connect with Tiben AI Academy on LinkedIn
                          </h4>
                          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                            Tiben AI Academy
                          </span>
                        </div>
                      </div>

                      <a
                        href="https://www.linkedin.com/company/tiben-ai-academy/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0"
                      >
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-[11px] border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 gap-1"
                        >
                          <span>Follow on LinkedIn</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Follow Tiben AI Academy for professional learning opportunities, industry insights, technology updates, Generative AI trends, and upcoming certification programs.
                    </p>
                    <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                      <input
                        type="checkbox"
                        checked={linkedinFollowed}
                        onChange={(e) => setLinkedinFollowed(e.target.checked)}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                      />
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">
                        I&apos;ve followed Tiben AI Academy on LinkedIn
                      </span>
                    </label>
                  </div>
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
                      Complete Registration
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
