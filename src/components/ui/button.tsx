import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#0D9488] text-white shadow-sm hover:bg-[#0f766e] font-semibold",
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-700",
        outline:
          "border border-slate-300 dark:border-[#1e3a5f] bg-transparent text-slate-800 dark:text-slate-200 shadow-sm hover:bg-slate-100 dark:hover:bg-[#0f2b4f]",
        secondary:
          "bg-slate-100 text-slate-800 dark:bg-[#132d52] dark:text-slate-100 shadow-sm hover:bg-slate-200 dark:hover:bg-[#183a69]",
        ghost:
          "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#132d52]",
        link: "text-[#0D9488] underline-offset-4 hover:underline",
        amber: "bg-[#F5A623] text-[#0B1F3A] font-bold shadow-sm hover:bg-[#d9820f]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
