"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  variant?: "auto" | "light" | "dark" | "symbol";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showSubtitle?: boolean;
  href?: string;
}

export function BrandLogo({
  variant = "auto",
  size = "md",
  className,
  showSubtitle = true,
  href,
}: BrandLogoProps) {
  // Height sizing
  const heightMap = {
    sm: "h-7",
    md: "h-9",
    lg: "h-11",
    xl: "h-14",
  };

  const logoContent = (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      {variant === "symbol" ? (
        <div className="relative aspect-square shrink-0 flex items-center justify-center">
          <svg
            className={cn(heightMap[size], "w-auto")}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="TiBen AI Academy Symbol"
          >
            <rect width="64" height="64" rx="14" fill="#0B1F3A" />
            <path
              d="M16.0 28.5 L32.0 12.5 L48.0 28.5"
              fill="none"
              stroke="#0D9488"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13.5 28.0 H50.5 V32.0 H37.0 L42.0 37.0 H36.0 V54.0 H28.0 V37.0 H22.0 L27.0 32.0 H13.5 Z"
              fill="#FFFFFF"
            />
            <circle cx="16.0" cy="29.0" r="4.0" fill="#0D9488" />
            <circle cx="48.0" cy="29.0" r="4.0" fill="#0D9488" />
            <circle cx="32.0" cy="12.5" r="4.5" fill="#F5A623" />
          </svg>
        </div>
      ) : variant === "dark" ? (
        /* Dark-background (Navy) version with white wordmark */
        <div className="flex items-center gap-2.5">
          <svg
            className={cn(heightMap[size], "w-auto shrink-0")}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="64" height="64" rx="14" fill="#0B1F3A" />
            <path
              d="M16.0 28.5 L32.0 12.5 L48.0 28.5"
              fill="none"
              stroke="#0D9488"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13.5 28.0 H50.5 V32.0 H37.0 L42.0 37.0 H36.0 V54.0 H28.0 V37.0 H22.0 L27.0 32.0 H13.5 Z"
              fill="#FFFFFF"
            />
            <circle cx="16.0" cy="29.0" r="4.0" fill="#0D9488" />
            <circle cx="48.0" cy="29.0" r="4.0" fill="#0D9488" />
            <circle cx="32.0" cy="12.5" r="4.5" fill="#F5A623" />
          </svg>
          <div className="flex flex-col leading-none">
            <span className="font-extrabold tracking-tight text-white font-sans text-base sm:text-lg">
              TiBen <span className="text-[#0D9488]">AI</span> Academy
            </span>
            {showSubtitle && (
              <span className="text-[10px] tracking-wider uppercase font-semibold text-[#F5A623] mt-0.5">
                AI &amp; Data Engineering
              </span>
            )}
          </div>
        </div>
      ) : variant === "light" ? (
        /* Light-background version with dark navy wordmark */
        <div className="flex items-center gap-2.5">
          <svg
            className={cn(heightMap[size], "w-auto shrink-0")}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="64" height="64" rx="14" fill="#0B1F3A" />
            <path
              d="M16.0 28.5 L32.0 12.5 L48.0 28.5"
              fill="none"
              stroke="#0D9488"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13.5 28.0 H50.5 V32.0 H37.0 L42.0 37.0 H36.0 V54.0 H28.0 V37.0 H22.0 L27.0 32.0 H13.5 Z"
              fill="#FFFFFF"
            />
            <circle cx="16.0" cy="29.0" r="4.0" fill="#0D9488" />
            <circle cx="48.0" cy="29.0" r="4.0" fill="#0D9488" />
            <circle cx="32.0" cy="12.5" r="4.5" fill="#F5A623" />
          </svg>
          <div className="flex flex-col leading-none">
            <span className="font-extrabold tracking-tight text-[#0B1F3A] font-sans text-base sm:text-lg">
              TiBen <span className="text-[#0D9488]">AI</span> Academy
            </span>
            {showSubtitle && (
              <span className="text-[10px] tracking-wider uppercase font-semibold text-[#0D9488] mt-0.5">
                AI &amp; Data Engineering
              </span>
            )}
          </div>
        </div>
      ) : (
        /* Auto adapts between Light & Dark themes */
        <div className="flex items-center gap-2.5">
          <svg
            className={cn(heightMap[size], "w-auto shrink-0 shadow-sm shadow-[#0B1F3A]/20 rounded-[10px]")}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="64" height="64" rx="14" fill="#0B1F3A" />
            <path
              d="M16.0 28.5 L32.0 12.5 L48.0 28.5"
              fill="none"
              stroke="#0D9488"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13.5 28.0 H50.5 V32.0 H37.0 L42.0 37.0 H36.0 V54.0 H28.0 V37.0 H22.0 L27.0 32.0 H13.5 Z"
              fill="#FFFFFF"
            />
            <circle cx="16.0" cy="29.0" r="4.0" fill="#0D9488" />
            <circle cx="48.0" cy="29.0" r="4.0" fill="#0D9488" />
            <circle cx="32.0" cy="12.5" r="4.5" fill="#F5A623" />
          </svg>
          <div className="flex flex-col leading-none">
            <span className="font-extrabold tracking-tight text-[#0B1F3A] dark:text-white font-sans text-base sm:text-lg transition-colors">
              TiBen <span className="text-[#0D9488]">AI</span> Academy
            </span>
            {showSubtitle && (
              <span className="text-[10px] tracking-wider uppercase font-bold text-[#F5A623] dark:text-[#0D9488] mt-0.5 transition-colors">
                AI &amp; Data Engineering
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center group">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}

