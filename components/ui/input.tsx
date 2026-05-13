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
        "flex h-14 w-full rounded-2xl border border-white/70 bg-white/75 px-5 text-base text-foreground shadow-lg shadow-black/5 outline-none backdrop-blur-xl transition duration-300 placeholder:text-muted-foreground focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";
