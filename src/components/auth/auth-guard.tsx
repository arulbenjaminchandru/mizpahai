"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuthGuardProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { user, userProfile, loading, isAdmin, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSuspendedSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error("Sign out error:", e);
    } finally {
      router.push("/login");
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (requireAdmin && !isAdmin) {
        router.push("/dashboard");
      }
    }
  }, [user, loading, isAdmin, requireAdmin, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-teal-400 animate-spin" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Verifying credentials...
            </p>
            <p className="text-xs text-slate-500 mt-1">TiBen AI Academy</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  // Account suspended check
  if (userProfile?.status === "suspended") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-red-500/40 rounded-xl p-6 text-center space-y-4 shadow-xl">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <ShieldAlert className="h-6 w-6 text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Account Suspended</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Your student account has been temporarily suspended. Please contact
            your course instructor or administrator at{" "}
            <a
              href="https://wa.me/919894481283?text=Hi%20Arul%2C%20my%20student%20account%20is%20suspended"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0D9488] hover:underline font-semibold"
            >
              +91-9894481283
            </a>
            .
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <a
              href="https://wa.me/919894481283?text=Hi%20Arul%2C%20my%20student%20account%20is%20suspended"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button
                type="button"
                className="w-full bg-[#0D9488] hover:bg-[#0b7c72] text-white font-medium"
              >
                Contact via WhatsApp (+91-9894481283)
              </Button>
            </a>
            <Button
              variant="outline"
              onClick={handleSuspendedSignOut}
              className="w-full border-slate-300 dark:border-slate-700"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-amber-500/40 rounded-xl p-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
            <ShieldAlert className="h-6 w-6 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Access Denied</h2>
          <p className="text-sm text-slate-400">
            You do not have administrative privileges to view this page.
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-teal-500 hover:bg-teal-600"
          >
            Go to Student Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

