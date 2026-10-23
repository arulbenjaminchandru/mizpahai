"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toast: (options: {
    type?: ToastType;
    title: string;
    description?: string;
    duration?: number;
  }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({
      type = "info",
      title,
      description,
      duration = 4000,
    }: {
      type?: ToastType;
      title: string;
      description?: string;
      duration?: number;
    }) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, description }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, description?: string) => {
      toast({ type: "success", title, description });
    },
    [toast]
  );

  const error = useCallback(
    (title: string, description?: string) => {
      toast({ type: "error", title, description, duration: 5000 });
    },
    [toast]
  );

  const info = useCallback(
    (title: string, description?: string) => {
      toast({ type: "info", title, description });
    },
    [toast]
  );

  const warning = useCallback(
    (title: string, description?: string) => {
      toast({ type: "warning", title, description });
    },
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      {/* Toast container */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const icons = {
            success: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />,
            error: <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />,
            warning: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />,
            info: <Info className="h-5 w-5 text-cyan-400 shrink-0" />,
          };

          const borders = {
            success: "border-emerald-500/40 bg-slate-900/95",
            error: "border-red-500/40 bg-slate-900/95",
            warning: "border-amber-500/40 bg-slate-900/95",
            info: "border-cyan-500/40 bg-slate-900/95",
          };

          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-xl backdrop-blur-sm animate-in slide-in-from-right duration-200 text-slate-100",
                borders[t.type]
              )}
            >
              {icons[t.type]}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{t.title}</p>
                {t.description && (
                  <p className="text-xs text-slate-400 mt-0.5 break-words">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-white"
                aria-label="Close notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

