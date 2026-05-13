"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Bot,
  FileText,
  Link2,
  LoaderCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { EnrichedAuditResponse } from "@/lib/audit";
import { AuditDashboard } from "@/components/audit-dashboard";
import { Card, CardContent } from "@/components/ui/card";

const loadingMessages = [
  "Fetching website...",
  "Parsing metadata...",
  "Running technical SEO checks...",
  "Evaluating AI visibility...",
  "Generating AI recommendations...",
  "Finalizing audit...",
];

export function AuditHero() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<EnrichedAuditResponse | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const activeAuditUrlRef = useRef<string | null>(null);
  const autoRunStartedRef = useRef(false);

  useEffect(() => {
    if (!loading) {
      setLoadingMessageIndex(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setLoadingMessageIndex((currentIndex) =>
        currentIndex === loadingMessages.length - 1 ? 0 : currentIndex + 1,
      );
    }, 1200);

    return () => window.clearInterval(intervalId);
  }, [loading]);

  const runAudit = useCallback(async (targetUrl: string) => {
    const submittedUrl = targetUrl.trim();

    if (!submittedUrl) {
      setError("Please enter a website URL to audit.");
      return;
    }

    if (activeAuditUrlRef.current === submittedUrl) {
      return;
    }

    activeAuditUrlRef.current = submittedUrl;
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: submittedUrl }),
      });

      const data = (await response.json()) as
        | EnrichedAuditResponse
        | { error: string };

      if (!response.ok || "error" in data) {
        throw new Error("Unable to run the audit.");
      }

      setReport(data);
    } catch (submissionError) {
      setReport(null);
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong while running the audit.",
      );
    } finally {
      setLoading(false);
      activeAuditUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (autoRunStartedRef.current) {
      return;
    }

    const submittedUrl = new URLSearchParams(window.location.search)
      .get("url")
      ?.trim();

    if (!submittedUrl) {
      return;
    }

    autoRunStartedRef.current = true;
    setUrl(submittedUrl);
    void runAudit(submittedUrl);
  }, [runAudit]);

  if (report) {
    return <AuditDashboard report={report} />;
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-[#101936]">
      <div className="grid min-h-screen lg:grid-cols-[248px_1fr]">
        <AuditShellSidebar />

        <section className="min-w-0 border-l border-slate-200/80">
          <header className="flex flex-col gap-4 px-4 py-7 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  SEO Audit Results
                </h1>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-[#4437ff]">
                  {loading ? "Running" : "Ready"}
                </span>
              </div>
              <p className="mt-2 text-base text-[#294066]">
                {loading
                  ? "Opening the fullscreen SEO intelligence dashboard."
                  : "Launch an audit from the EFFIX homepage to open this workspace."}
              </p>
            </div>
          </header>

          <div className="px-4 pb-6 sm:px-6 lg:px-8">
            {loading ? (
              <LoadingDashboard
                url={url}
                message={loadingMessages[loadingMessageIndex]}
              />
            ) : (
              <ReadyDashboard error={error} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function AuditShellSidebar() {
  const items = [
    { label: "Overview", icon: Search, active: true },
    { label: "Technical SEO", icon: Wrench },
    { label: "Content Quality", icon: FileText },
    { label: "AI Visibility", icon: Bot },
    { label: "Performance", icon: BarChart3 },
    { label: "Links & Authority", icon: Link2 },
  ];

  return (
    <aside className="bg-white px-4 py-6">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 rotate-45 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#3f37ff] to-[#7657ff] shadow-lg shadow-indigo-500/20">
          <div className="h-3.5 w-3.5 rounded-[4px] border-2 border-white" />
        </div>
        <span className="font-display text-2xl font-bold tracking-[0.16em] text-[#101936]">
          EFFIX
        </span>
      </div>

      <div className="mb-7">
        <p className="mb-3 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
          Audit
        </p>
        <div className="space-y-1.5">
          {items.map(({ label, icon: Icon, active }) => (
            <button
              key={label}
              type="button"
              className={`relative flex h-11 w-full items-center gap-3 rounded-[12px] px-3 text-sm font-semibold transition duration-300 ${
                active
                  ? "bg-indigo-50 text-[#332bff]"
                  : "text-slate-700 hover:bg-slate-50 hover:text-[#332bff]"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
              {active ? (
                <span className="absolute right-0 top-2 h-7 w-0.5 rounded-full bg-[#4437ff]" />
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-[18px] border border-indigo-100 bg-gradient-to-b from-white to-indigo-50/70 p-5 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
          <Sparkles className="h-5 w-5" />
        </div>
        <p className="font-display text-base font-bold text-[#101936]">
          Analytics Workspace
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          The full audit dashboard opens automatically after the crawl finishes.
        </p>
      </div>
    </aside>
  );
}

function LoadingDashboard({ url, message }: { url: string; message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="space-y-5"
    >
      <Card className="relative overflow-hidden rounded-[18px] border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(83,72,255,0.10),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(247,249,255,0.92))]" />
        <CardContent className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_260px] lg:items-center">
          <div className="space-y-4">
            <p className="text-sm font-medium text-[#294066]">Analyzing URL</p>
            <h2 className="break-all font-display text-2xl font-bold tracking-tight text-[#101936] sm:text-3xl">
              {url}
            </h2>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={message}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="text-base text-[#294066]"
              >
                {message}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-white shadow-[0_20px_60px_rgba(63,55,255,0.12)]">
              <motion.div
                className="absolute inset-0 rounded-full border-[10px] border-indigo-100"
                animate={{ scale: [1, 1.04, 1] }}
                transition={{
                  duration: 1.6,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-[10px] border-transparent border-r-[#4437ff] border-t-[#4437ff]"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1.15,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              />
              <LoaderCircle className="h-10 w-10 animate-spin text-[#4437ff]" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {["Technical SEO", "Content Quality", "AI Visibility", "Overall Score"].map(
          (label) => (
            <Card key={label} className="rounded-[16px] border-slate-200 bg-white">
              <CardContent className="space-y-4 p-5">
                <div className="h-10 w-10 rounded-[12px] bg-indigo-50" />
                <div className="h-3 w-28 rounded-full bg-slate-100" />
                <div className="h-8 w-20 rounded-full bg-slate-100" />
                <div className="flex h-16 items-end gap-1.5 rounded-[14px] bg-indigo-50/50 p-3">
                  {[42, 58, 46, 66, 54, 74, 62].map((height, index) => (
                    <motion.div
                      key={`${label}-${index}`}
                      animate={{ height: [`${height * 0.55}%`, `${height}%`] }}
                      transition={{
                        duration: 0.8,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "reverse",
                        delay: index * 0.05,
                      }}
                      className="flex-1 rounded-t-full bg-indigo-200"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ),
        )}
      </div>
    </motion.div>
  );
}

function ReadyDashboard({ error }: { error: string }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
      <Card className="rounded-[18px] border-slate-200 bg-white">
        <CardContent className="space-y-5 p-6 sm:p-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-indigo-50 text-[#4437ff]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-[#101936]">
              Ready for analysis
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#294066]">
              This screen is the audit application shell. Open it from the
              EFFIX homepage with a URL parameter to launch directly into the
              full results dashboard.
            </p>
          </div>
          {error ? (
            <p className="rounded-[12px] border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-[18px] border-slate-200 bg-white">
        <CardContent className="space-y-4 p-5">
          <h3 className="font-display text-lg font-bold text-[#101936]">
            Dashboard Modules
          </h3>
          {[
            "Priority issues",
            "Fixes by priority",
            "AI insights",
            "Score history",
            "Technical and content tabs",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm text-[#294066]">
              <span className="h-2 w-2 rounded-full bg-[#4437ff]" />
              {item}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
