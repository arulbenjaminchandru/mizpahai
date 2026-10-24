"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Sparkles,
  Shield,
  BookOpen,
  KeyRound,
  LogOut,
  User as UserIcon,
  HelpCircle,
  Menu,
  X,
  GraduationCap,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/ui/brand-logo";

export function Navbar() {
  const { user, userProfile, isAdmin, signOut, loading } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu whenever the route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-[#1e3a5f] dark:bg-[#071527]/95 transition-colors">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <BrandLogo href="/" size="md" />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 sm:gap-2">
          <Link href="/instructions">
            <Button
              variant={pathname === "/instructions" ? "secondary" : "ghost"}
              size="sm"
              className="text-xs sm:text-sm gap-1.5 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400"
            >
              <HelpCircle className="h-4 w-4 text-teal-500" />
              <span>Guide</span>
            </Button>
          </Link>

          {user ? (
            <>
              <Link href="/dashboard">
                <Button
                  variant={pathname.startsWith("/dashboard") ? "secondary" : "ghost"}
                  size="sm"
                  className="text-xs sm:text-sm gap-1.5 text-slate-700 dark:text-slate-200"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>My Courses</span>
                </Button>
              </Link>

              <Link href="/redeem">
                <Button
                  variant={pathname === "/redeem" ? "secondary" : "ghost"}
                  size="sm"
                  className="text-xs sm:text-sm gap-1.5 text-teal-600 dark:text-teal-400 hover:text-teal-500"
                >
                  <KeyRound className="h-4 w-4" />
                  <span>Redeem Code</span>
                </Button>
              </Link>

              {isAdmin && (
                <Link href="/admin">
                  <Button
                    variant={pathname.startsWith("/admin") ? "secondary" : "outline"}
                    size="sm"
                    className="text-xs sm:text-sm gap-1.5 border-teal-500/40 text-teal-600 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/30"
                  >
                    <Shield className="h-4 w-4 text-teal-500" />
                    <span>Admin</span>
                  </Button>
                </Link>
              )}

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User menu */}
              <div className="flex items-center gap-2 ml-1 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="hidden lg:flex flex-col items-end text-right">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                    {userProfile?.displayName || user.displayName || user.email?.split("@")[0]}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
                    {isAdmin ? "Admin" : "Student"}
                  </span>
                </div>

                <Link href="/profile">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-8 w-8 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                    title="Profile & Settings"
                  >
                    <UserIcon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut()}
                  className="h-8 w-8 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : !loading ? (
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-slate-700 dark:text-slate-200">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold"
                >
                  Enroll
                </Button>
              </Link>
            </div>
          ) : (
            <ThemeToggle />
          )}
        </nav>

        {/* Mobile Top Controls: ThemeToggle + Hamburger */}
        <div className="flex md:hidden items-center gap-1.5">
          <ThemeToggle />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-9 w-9 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Slide-down Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-[#1e3a5f] bg-white/95 dark:bg-[#071527]/98 backdrop-blur-md px-4 py-4 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-200">
          {user && (
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 px-1">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                  {userProfile?.displayName || user.displayName || user.email?.split("@")[0]}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                  {user.email}
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] border-teal-500/40 text-teal-600 dark:text-teal-400 uppercase">
                {isAdmin ? "Admin" : "Student"}
              </Badge>
            </div>
          )}

          <div className="flex flex-col space-y-1">
            <Link
              href="/instructions"
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                pathname === "/instructions"
                  ? "bg-teal-500/15 text-teal-600 dark:text-teal-300 font-bold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
              }`}
            >
              <HelpCircle className="h-4 w-4 text-teal-500" />
              <span>Student Guide &amp; How to Activate</span>
            </Link>

            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    pathname.startsWith("/dashboard")
                      ? "bg-teal-500/15 text-teal-600 dark:text-teal-300 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                  }`}
                >
                  <BookOpen className="h-4 w-4 text-teal-500" />
                  <span>My Courses &amp; Classroom</span>
                </Link>

                <Link
                  href="/redeem"
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    pathname === "/redeem"
                      ? "bg-teal-500/15 text-teal-600 dark:text-teal-300 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                  }`}
                >
                  <KeyRound className="h-4 w-4 text-amber-500" />
                  <span>Redeem Enrollment Code</span>
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                      pathname.startsWith("/admin")
                        ? "bg-teal-500/15 text-teal-600 dark:text-teal-300 font-bold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                    }`}
                  >
                    <Shield className="h-4 w-4 text-teal-500" />
                    <span>Admin Console</span>
                  </Link>
                )}

                <Link
                  href="/profile"
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    pathname === "/profile"
                      ? "bg-teal-500/15 text-teal-600 dark:text-teal-300 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                  }`}
                >
                  <UserIcon className="h-4 w-4 text-cyan-500" />
                  <span>Profile &amp; Authorizations</span>
                </Link>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    className="w-full justify-start text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 gap-2.5 h-10 px-3"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </Button>
                </div>
              </>
            ) : (
              <div className="pt-2 flex flex-col gap-2">
                <Link href="/login" className="w-full">
                  <Button variant="outline" className="w-full text-xs font-bold border-slate-300 dark:border-slate-700">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" className="w-full">
                  <Button className="w-full text-xs font-bold bg-teal-500 hover:bg-teal-600 text-slate-950">
                    Enroll in Cohort
                  </Button>
                </Link>
                <Link href="/redeem" className="w-full">
                  <Button variant="ghost" className="w-full text-xs text-teal-600 dark:text-teal-400 gap-1.5">
                    <KeyRound className="h-3.5 w-3.5" />
                    Redeem Code Directly
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
