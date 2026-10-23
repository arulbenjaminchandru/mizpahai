"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  KeyRound,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: "Courses & Content",
    href: "/admin/courses",
    icon: BookOpen,
    exact: false,
  },
  {
    title: "Student Roster",
    href: "/admin/students",
    icon: Users,
    exact: false,
  },
  {
    title: "Enrollment Codes",
    href: "/admin/enrollment-codes",
    icon: KeyRound,
    exact: false,
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-64 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 sm:p-3 shrink-0 h-fit space-y-2 shadow-sm">
      <div className="px-2 sm:px-3 py-1 sm:py-2 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center justify-between">
        <span>Admin Console</span>
        <span className="text-[10px] bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/30">
          Faculty
        </span>
      </div>

      <nav className="flex md:flex-col overflow-x-auto md:overflow-visible gap-1.5 md:space-y-1 pb-1 md:pb-0">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 md:shrink whitespace-nowrap",
                isActive
                  ? "bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.title}</span>
              </div>
              <ChevronRight
                className={cn(
                  "hidden md:block h-3.5 w-3.5 ml-2",
                  isActive ? "text-slate-950" : "text-slate-400 dark:text-slate-600"
                )}
              />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

