"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Play,
  PlayCircle,
  KeyRound,
  BookOpen,
  GraduationCap,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Sparkles,
} from "lucide-react";

/**
 * Public YouTube student platform walkthrough video link.
 * Watch on YouTube: https://youtu.be/6oZawdsqq7A
 */
export const PUBLIC_YOUTUBE_WALKTHROUGH_URL = "https://www.youtube.com/watch?v=6oZawdsqq7A";

interface StudentWalkthroughVideoProps {
  youtubeUrl?: string;
  className?: string;
  showStepRoadmap?: boolean;
}

export function StudentWalkthroughVideo({
  youtubeUrl = PUBLIC_YOUTUBE_WALKTHROUGH_URL,
  className = "",
  showStepRoadmap = true,
}: StudentWalkthroughVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Helper to normalize any standard YouTube URL (watch?v=, youtu.be/, embed/)
  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    try {
      if (url.includes("embed/")) return url;
      if (url.includes("youtu.be/")) {
        const id = url.split("youtu.be/")[1]?.split("?")[0]?.split("/")[0];
        return `https://www.youtube.com/embed/${id}?rel=0`;
      }
      if (url.includes("watch?v=")) {
        const id = new URL(url).searchParams.get("v");
        return `https://www.youtube.com/embed/${id}?rel=0`;
      }
      return url;
    } catch {
      return url;
    }
  };

  const finalEmbedUrl = getEmbedUrl(youtubeUrl);

  const quickSteps = [
    {
      num: "01",
      title: "Get Access Code",
      desc: "Unique cohort code delivered upon registration (+91-9894481283).",
      icon: KeyRound,
      color: "text-amber-500 dark:text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/30",
    },
    {
      num: "02",
      title: "Sign In with Google",
      desc: "One-click authentication using your personal or student Google ID.",
      icon: ShieldCheck,
      color: "text-teal-500 dark:text-teal-400",
      bg: "bg-teal-500/10 border-teal-500/30",
    },
    {
      num: "03",
      title: "Redeem Access Key",
      desc: "Instant format-tolerant code redemption mapped to your UID.",
      icon: Sparkles,
      color: "text-cyan-500 dark:text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/30",
    },
    {
      num: "04",
      title: "Stream & Download",
      desc: "Watch 11 weeks of HD recordings, download Google Drive code labs.",
      icon: GraduationCap,
      color: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/30",
    },
  ];

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Video Container Box */}
      <div className="relative rounded-2xl overflow-hidden border border-teal-500/30 bg-slate-950 shadow-2xl shadow-teal-950/20">
        {/* Top Header Bar of Video Player */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-white tracking-wide">
              Official Platform Walkthrough · TiBen AI Academy
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[10px] font-mono font-semibold border-teal-500/40 text-teal-400 bg-teal-500/10"
            >
              Full HD 1080p · Audio &amp; Captions
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px] font-mono font-semibold border-slate-700 text-slate-300 bg-slate-800"
            >
              https://tibenai.in
            </Badge>
          </div>
        </div>

        {/* Media Player Area */}
        <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center">
          {finalEmbedUrl ? (
            <iframe
              src={finalEmbedUrl}
              title="TiBen AI Academy Student Platform Walkthrough"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <video
              controls
              playsInline
              preload="metadata"
              className="w-full h-full object-contain"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source src="/videos/tibenai-student-guide.mp4" type="video/mp4" />
              <source src="/videos/tibenai-student-guide.webm" type="video/webm" />
              Your browser does not support the video tag. Please update to a modern browser.
            </video>
          )}
        </div>

        {/* Footer Sub-Bar */}
        <div className="px-5 py-3.5 bg-slate-900/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" />
            <span>Covers account login, cohort redemption, live video player, and Google Drive labs</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://youtu.be/6oZawdsqq7A"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 gap-1.5"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Watch on YouTube</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
            <Link href="/instructions">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 h-8 gap-1.5"
              >
                <span>Read Written Guide</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
            <Link href="/redeem">
              <Button
                size="sm"
                className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs h-8 gap-1.5"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Redeem Code</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Quick Onboarding Cards */}
      {showStepRoadmap && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickSteps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-4 space-y-2 backdrop-blur-xs shadow-xs hover:border-teal-500/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center border ${s.bg} ${s.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                    {s.num}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {s.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

