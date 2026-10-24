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
  const { user, userProfile, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
        <div className="max-w-md w-full bg-slate-900 border border-red-500/40 rounded-xl p-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <ShieldAlert className="h-6 w-6 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Account Suspended</h2>
          <p className="text-sm text-slate-400">
            Your student account has been temporarily suspended. Please contact
            your course instructor or administrator at{" "}
            <span className="text-teal-400 font-mono">support@datahorizon.ai</span>.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/login")}
            className="w-full"
          >
            Sign Out
          </Button>
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

