import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-900",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#0D9488]/15 text-[#0D9488] dark:text-[#14b8a6]",
        secondary:
          "border-transparent bg-slate-100 text-slate-700 dark:bg-[#132d52] dark:text-slate-300",
        destructive:
          "border-transparent bg-red-500/15 text-red-600 dark:text-red-400",
        outline: "border-slate-300 text-slate-700 dark:border-[#1e3a5f] dark:text-slate-300",
        amber: "border-transparent bg-[#F5A623]/15 text-[#d9820f] dark:text-[#F5A623]",
        navy: "border-transparent bg-[#0B1F3A] text-white dark:bg-[#132d52]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
