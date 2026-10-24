"use client";

import Link from "next/link";
import { Navbar } from "@/components/navigation/navbar";
import { Footer } from "@/components/navigation/footer";
import { StudentWalkthroughVideo } from "@/components/video/StudentWalkthroughVideo";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  KeyRound,
  LogIn,
  UserPlus,
  PlayCircle,
  FileCode2,
  CheckCircle2,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  AlertTriangle,
  Laptop,
  LayoutDashboard,
  Compass,
  ExternalLink,
  Video,
} from "lucide-react";

export default function InstructionsPage() {
  const steps = [
    {
      num: "01",
      icon: UserPlus,
      title: "Step 1: Account Registration",
      subtitle: "Establish your verified student identity on TiBen AI Academy",
      color: "text-teal-600 dark:text-teal-400",
      bgColor: "bg-teal-500/10 border-teal-500/30",
      description:
        "Every cohort participant requires an authenticated profile on the LMS. Your account securely stores your course unlocks, lesson progress, and session timestamps.",
      details: [
        "Navigate to the Register page by clicking 'Enroll' or 'Register' in the top navigation bar.",
        "Choose your preferred sign-up method: One-click Google Sign-In or standard Email and Password.",
        "If using email, choose a strong password (minimum 8 characters with numbers and letters).",
        "Important: Use the same email address that you provided to the academy during admission so your Google Drive material permissions match seamlessly.",
      ],
      action: {
        label: "Create Account",
        href: "/register",
      },
    },
    {
      num: "02",
      icon: LogIn,
      title: "Step 2: Sign In / Authentication",
      subtitle: "Access your personalized learning portal",
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-500/10 border-cyan-500/30",
      description:
        "Once registered, your session persists securely. Return any time to resume from your last watched lecture.",
      details: [
        "Go to the Login page from the navigation bar or by visiting /login directly.",
        "Sign in using Google or enter your registered email and password.",
        "If you ever forget your password, click 'Forgot password?' on the login form to receive an automated password reset link from Firebase Authentication.",
        "Both dark mode and light mode are preserved in your browser preferences across sign-in sessions.",
      ],
      action: {
        label: "Sign In Now",
        href: "/login",
      },
    },
    {
      num: "03",
      icon: KeyRound,
      title: "Step 3: Course Activation (Enrollment Code)",
      subtitle: "Redeem your unique, cryptographically signed cohort key",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10 border-amber-500/30",
      description:
        "TiBen AI Academy is a private learning portal. Access to course recordings and resources is unlocked with your unique cohort enrollment code issued upon enrollment.",
      details: [
        "Upon enrollment confirmation in Data Horizon or another cohort, you will receive your unique access code (e.g. DH-2026-LUCU1G) directly via WhatsApp or email.",
        "Sign into https://tibenai.in and click 'Redeem Code' in the navigation bar, or navigate directly to /redeem.",
        "Enter your code in the activation input box (the field is case-insensitive and format-friendly).",
        "Click 'Unlock Course Access'. Your seat is immediately authenticated and course privileges are permanently linked to your student account.",
        "Upon successful activation, you are redirected straight into your interactive classroom.",
      ],
      action: {
        label: "Redeem Access Code",
        href: "/redeem",
      },
    },
    {
      num: "04",
      icon: PlayCircle,
      title: "Step 4: Classroom & Video Playback",
      subtitle: "Watch private, unlisted lecture recordings distraction-free",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10 border-emerald-500/30",
      description:
        "Cohort recordings are streamed through the official YouTube IFrame Player with strict student authorization checks.",
      details: [
        "From your Dashboard (/dashboard), select your course and click 'Go to Classroom'.",
        "Browse the curriculum hierarchy on the right sidebar organized into Weeks, Modules, and Lessons.",
        "Click any lesson to start playback. Videos stream in full HD with zero third-party ads or algorithmic distractions.",
        "Click 'Mark as Completed' when you finish a session to record your progress in your student profile and trigger your completion checkmark.",
        "You can easily navigate to previous or next lessons using the control bar below the video player.",
      ],
      action: {
        label: "Go to Dashboard",
        href: "/dashboard",
      },
    },
    {
      num: "05",
      icon: FileCode2,
      title: "Step 5: Google Drive Learning Materials",
      subtitle: "Download datasets, architecture diagrams, and Python/PySpark notebooks",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10 border-purple-500/30",
      description:
        "Every session links directly to authoritative Google Drive folders containing hands-on practice assets.",
      details: [
        "In the classroom view, switch to the 'Learning Materials' tab under the video player.",
        "Click 'Open on Google Drive' to view or download code templates, presentation decks, and sample datasets.",
        "Ensure your web browser is signed into the same Google Account registered with the academy.",
        "Store your completed exercises locally or commit them to your personal GitHub repository for mentor review.",
      ],
    },
    {
      num: "06",
      icon: LayoutDashboard,
      title: "Step 6: Dashboard & Curriculum Navigation",
      subtitle: "Track completion progress and resume lessons anytime",
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-500/10 border-indigo-500/30",
      description:
        "Your student dashboard provides an executive overview of all enrolled programs, lesson completion bars, and next recommended modules.",
      details: [
        "Access your private dashboard at any time by clicking 'Dashboard' in the top navigation bar or visiting /dashboard.",
        "Review your real-time completion percentage calculated across all published modules.",
        "Click 'Watch Lesson' or 'Continue Learning' on any enrolled course to jump directly to where you left off.",
        "Use the sidebar curriculum tree to seamlessly switch between weeks and review previous lecture notes.",
        "If you need help or have doubt clarification, click 'WhatsApp Arul' (+91-9894481283) directly from the header or footer.",
      ],
      action: {
        label: "Go to Dashboard",
        href: "/dashboard",
      },
    },
  ];

  const quickNav = [
    { title: "Home / Curriculum", href: "/", desc: "Course syllabus, batch dates, and founder profile", icon: Compass },
    { title: "Student Login", href: "/login", desc: "Access with Google or registered email & password", icon: LogIn },
    { title: "New Registration", href: "/register", desc: "Create your student identity profile", icon: UserPlus },
    { title: "Redeem Enrollment Code", href: "/redeem", desc: "Activate your cohort access key", icon: KeyRound },
    { title: "Classroom Dashboard", href: "/dashboard", desc: "Your unlocked courses and lesson progress", icon: LayoutDashboard },
    { title: "Platform Walkthrough Video", href: "https://youtu.be/6oZawdsqq7A", desc: "Watch the official YouTube video guide", icon: Video, external: true },
  ];

  const faqs = [
    {
      q: "Why am I seeing 'Enrollment Required' when opening a course?",
      a: "TiBen AI Academy is private. If you have not yet redeemed a valid enrollment code for that specific course batch, the classroom remains locked. Head to the 'Redeem Code' page and enter the access code received upon enrollment, or contact admissions on WhatsApp at +91-9894481283.",
    },
    {
      q: "What should I do if the YouTube video player does not load?",
      a: "Our player uses the official YouTube IFrame Embed API. If you have aggressive browser extensions or ad-blockers installed, they might block the embed script. Please whitelist this domain or try an Incognito/Private window.",
    },
    {
      q: "Can I access the LMS from mobile devices?",
      a: "Yes! The platform is fully responsive and optimized for desktops, tablets, and smartphones, with full dark and light mode support.",
    },
    {
      q: "How do I get my unique course activation code?",
      a: "Activation codes are issued directly by Arul Benjamin or admissions upon seat confirmation in a cohort like Data Horizon. If you have confirmed your fee and have not received your code, contact admissions via WhatsApp at +91-9894481283.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#071527] dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1">
        {/* Header Hero */}
        <div className="border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm py-12 sm:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <Badge
              variant="outline"
              className="text-xs uppercase tracking-wider font-semibold border-teal-500/30 text-teal-600 dark:text-teal-400 bg-teal-500/10"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Student Onboarding &amp; User Manual
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              How to Register, Sign In &amp; Activate Courses
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Welcome to the official <strong>TiBen AI Academy Portal (<a href="https://tibenai.in" className="text-teal-600 dark:text-teal-400 font-semibold underline">https://tibenai.in</a>)</strong>.
              Follow this step-by-step video and written guide to set up your account, activate your cohort enrollment code, and access live session recordings and lab materials.
            </p>
          </div>
        </div>

        {/* Video Walkthrough Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <StudentWalkthroughVideo showStepRoadmap={false} />
        </div>

        {/* Steps Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
          <div className="space-y-8">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <Card
                  key={step.num}
                  className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 shadow-md overflow-hidden"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border ${step.bgColor} ${step.color}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                              {step.num}
                            </span>
                            <CardTitle className="text-lg sm:text-xl text-slate-900 dark:text-white">
                              {step.title}
                            </CardTitle>
                          </div>
                          <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            {step.subtitle}
                          </CardDescription>
                        </div>
                      </div>

                      {step.action && (
                        <Link href={step.action.href} className="hidden sm:inline-block shrink-0">
                          <Button
                            size="sm"
                            className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs gap-1.5"
                          >
                            <span>{step.action.label}</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-1">
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {step.description}
                    </p>

                    <div className="bg-slate-50 dark:bg-[#071527]/60 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Action Checklist:
                      </span>
                      <ul className="space-y-2">
                        {step.details.map((detail, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed"
                          >
                            <CheckCircle2 className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {step.action && (
                      <div className="sm:hidden pt-2">
                        <Link href={step.action.href} className="w-full block">
                          <Button
                            size="sm"
                            className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs gap-1.5"
                          >
                            <span>{step.action.label}</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Code Format Callout */}
          <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 space-y-3">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <h3 className="text-sm font-bold">Understanding Your Enrollment Code</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              TiBen AI Academy enrollment codes are formatted like <code className="font-mono bg-amber-500/10 px-2 py-0.5 rounded text-amber-600 dark:text-amber-400 font-bold">DH-2026-XXXXXX</code>.
              Each code is uniquely generated, cryptographically validated, and tied to a specific cohort batch.
              Codes cannot be shared; once redeemed by your account, access is permanently mapped to your authenticated user identity.
            </p>
          </div>

          {/* Quick Platform Navigation Directory */}
          <div className="pt-4 space-y-4">
            <div className="text-center space-y-1 mb-6">
              <Badge
                variant="outline"
                className="text-xs uppercase tracking-wider font-semibold border-teal-500/30 text-teal-600 dark:text-teal-400 bg-teal-500/10 mb-2"
              >
                <Compass className="h-3 w-3 mr-1" />
                Quick Links Directory
              </Badge>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Student Portal Navigation Hub
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Direct access shortcuts to every key section of the TiBen AI Academy platform
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickNav.map((item, idx) => {
                const Icon = item.icon;
                const Content = (
                  <div className="h-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs hover:border-teal-500/50 hover:bg-teal-500/5 transition-all group">
                    <div className="flex items-start justify-between">
                      <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform">
                        <Icon className="h-4 w-4" />
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-teal-500 transition-colors" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-3 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                );

                return item.external ? (
                  <a
                    key={idx}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    {Content}
                  </a>
                ) : (
                  <Link key={idx} href={item.href} className="block">
                    {Content}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="pt-6 space-y-4">
            <div className="text-center space-y-1 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Frequently Asked Onboarding Questions
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Common troubleshooting tips for cohort members
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 shadow-xs space-y-1.5"
                >
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-teal-500 shrink-0" />
                    <span>{faq.q}</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-6">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Need Help Box */}
          <Card className="border-teal-500/30 bg-gradient-to-r from-teal-500/10 via-slate-50 to-white dark:from-teal-950/30 dark:via-slate-900 dark:to-slate-900/80 p-6 sm:p-8 text-center space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Need Assistance with Registration or Enrollment?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
              Our admissions team and mentor support are on standby to resolve any login or course access queries.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href="https://wa.me/919894481283?text=Hi%20Arul%2C%20I%20need%20help%20with%20my%20TiBen%20AI%20Academy%20account"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs gap-2">
                  <Phone className="h-3.5 w-3.5" />
                  WhatsApp (+91-9894481283)
                </Button>
              </a>
              <a href="tel:+919894481283">
                <Button variant="outline" className="border-slate-300 dark:border-slate-700 text-xs gap-2">
                  <Phone className="h-3.5 w-3.5" />
                  Call +91-9894481283
                </Button>
              </a>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

