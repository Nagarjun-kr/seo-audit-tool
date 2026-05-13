import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-14 w-full rounded-2xl border border-white/25 bg-white/70 px-5 text-base text-foreground shadow-lg shadow-black/5 outline-none transition duration-300 placeholder:text-muted-foreground focus:border-primary/60 focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";
