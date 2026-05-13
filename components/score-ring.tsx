"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";

import { cn } from "@/lib/utils";

type ScoreRingProps = {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
};

const scoreStates = {
  poor: {
    label: "Poor",
    stroke: "#ef4444",
    glow: "",
    badge:
      "border border-red-500/20 bg-red-500/12 text-red-700",
  },
  "needs-work": {
    label: "Needs Work",
    stroke: "#4437ff",
    glow: "",
    badge:
      "border border-amber-500/20 bg-amber-500/12 text-amber-700",
  },
  strong: {
    label: "Strong",
    stroke: "#10b981",
    glow: "",
    badge:
      "border border-emerald-500/20 bg-emerald-500/12 text-emerald-700",
  },
} as const;

export function ScoreRing({
  score,
  size = 152,
  strokeWidth = 12,
  className,
  label = "SEO Score",
}: ScoreRingProps) {
  const normalizedScore = Math.max(0, Math.min(100, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (normalizedScore / 100) * circumference;
  const count = useMotionValue(0);
  const roundedCount = useTransform(count, (latest) => Math.round(latest));
  const state = getScoreState(normalizedScore);
  const ringState = scoreStates[state];

  useEffect(() => {
    const controls = animate(count, normalizedScore, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
    });

    return () => controls.stop();
  }, [count, normalizedScore]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-[24px] bg-white p-3",
        ringState.glow,
        className,
      )}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-indigo-100"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={ringState.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: progress }}
            transition={{ duration: 1.25, ease: [0.22, 1, 0.36, 1] }}
            style={{
              filter: `drop-shadow(0 6px 12px ${ringState.stroke}18)`,
            }}
          />
        </svg>

        <div className="absolute inset-[18%] flex flex-col items-center justify-center rounded-full bg-white">
          <motion.span className="font-display text-4xl font-bold tracking-tight text-[#101936]">
            {roundedCount}
          </motion.span>
          <span className="mt-1 text-xs font-medium text-[#101936]">
            {label}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "mt-4 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em]",
          ringState.badge,
        )}
      >
        {ringState.label}
      </div>
    </motion.div>
  );
}

function getScoreState(score: number) {
  if (score <= 49) {
    return "poor";
  }

  if (score <= 79) {
    return "needs-work";
  }

  return "strong";
}
