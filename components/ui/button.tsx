import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
};

const styles = {
  default:
    "bg-slate-950 text-white shadow-lg shadow-slate-950/15 hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:ring-primary/40 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200",
  outline:
    "border border-white/60 bg-white/55 shadow-sm shadow-black/5 hover:-translate-y-0.5 hover:bg-white/75 hover:text-accent-foreground dark:border-white/10 dark:bg-white/6 dark:hover:bg-white/10",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-60",
          styles[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
