import Link from "next/link";
import { Sparkles, ShieldCheck, Database, Award, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-500">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Mizpah AI <span className="font-normal text-slate-400 dark:text-slate-500">/ Data Horizon</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Mizpah AI Learning Management System — an enterprise-grade, private learning environment for engineering cohorts.
            </p>
            <div className="pt-1 text-xs text-slate-500 dark:text-slate-400">
              Mentor: <strong>Arul Benjamin</strong> — AI Architect · Founder, Mizpah AI
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-3">
              LMS Quick Links
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/instructions" className="hover:text-teal-500 transition-colors">
                  How to Register &amp; Activate
                </Link>
              </li>
              <li>
                <Link href="/redeem" className="hover:text-teal-500 transition-colors">
                  Redeem Enrollment Code
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-teal-500 transition-colors">
                  Student &amp; Admin Sign In
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-teal-500 transition-colors">
                  My Classroom Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-3">
              Featured Certifications
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>Databricks Data Engineer Assoc.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <span>Microsoft Fabric (DP-700)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                <span>Claude Certified Architect (CCAR-F)</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-3">
              Contact &amp; Admissions
            </h4>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <a
                href="https://wa.me/919894481283?text=Hi%20Arul%2C%20I%20have%20a%20question%20about%20Data%20Horizon"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-teal-500 transition-colors"
              >
                <Phone className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                <span>+91 98944 81283 (WhatsApp)</span>
              </a>
              <a
                href="mailto:arulbenjaminchandru@gmail.com"
                className="flex items-center gap-2 hover:text-teal-500 transition-colors"
              >
                <Mail className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="truncate">arulbenjaminchandru@gmail.com</span>
              </a>
              <a
                href="https://www.linkedin.com/in/arulbenjamin"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-teal-500 transition-colors"
              >
                <svg className="h-3.5 w-3.5 text-blue-500 shrink-0 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.88a1.45 1.45 0 0 0-1.46 1.46 1.46 1.46 0 0 0 1.46 1.46 1.46 1.46 0 0 0 1.46-1.46c0-.81-.65-1.46-1.46-1.46Z" />
                </svg>
                <span>linkedin.com/in/arulbenjamin</span>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-500 gap-2">
          <p>© {new Date().getFullYear()} Mizpah AI · Chennai, India · Live online via Microsoft Teams</p>
          <p className="font-mono text-[11px] uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Skills · Certifications · Projects · Lifelong Learning
          </p>
        </div>
      </div>
    </footer>
  );
}
