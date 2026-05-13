"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-11 w-11 rounded-full border border-transparent" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="glass inline-flex h-11 w-11 items-center justify-center rounded-full transition duration-300 hover:-translate-y-0.5"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <MoonStar className="h-5 w-5 text-slate-100" />
      ) : (
        <SunMedium className="h-5 w-5 text-amber-500" />
      )}
    </button>
  );
}
