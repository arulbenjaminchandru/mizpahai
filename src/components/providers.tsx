"use client";

import { type ReactNode } from "react";
import { AuthProvider } from "@/lib/firebase/auth-context";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/lib/theme-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
