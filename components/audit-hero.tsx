"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Globe, LoaderCircle, Sparkles, Zap } from "lucide-react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

import type { EnrichedAuditResponse } from "@/lib/audit";
import { AuditDashboard } from "@/components/audit-dashboard";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const featurePills = [
  "SEO Snapshot",
  "AI Answer Visibility",
  "Content Signals",
];

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runAudit(url);
  }

  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-hero-grid bg-[size:48px_48px] opacity-[0.08] dark:opacity-[0.06]" />
      <div className="absolute left-1/2 top-24 -z-10 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-amber-300/30 blur-3xl dark:bg-amber-400/10" />

      <section className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        <div className="mx-auto flex max-w-5xl flex-col items-center pt-10 text-center md:pt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-muted-foreground"
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            Modern audit tooling for search and generative engines
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="max-w-4xl font-display text-5xl font-bold tracking-tight md:text-7xl"
          >
            SEO Audit &amp; AI Visibility Tool
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="mt-5 max-w-2xl text-lg text-muted-foreground md:text-xl"
          >
            Simple, Affordable SEO / GEO Toolset
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="mt-12 w-full max-w-3xl"
          >
            <Card className="glass-strong rounded-[32px]">
              <CardContent className="p-4 md:p-5">
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-3 md:flex-row"
                >
                  <div className="relative flex-1">
                    <Globe className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="url"
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      placeholder="Enter your website URL"
                      className="pl-12"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-14 min-w-36 rounded-2xl text-base"
                  >
                    {loading ? (
                      <>
                        <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                        Auditing...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-5 w-5" />
                        Audit
                      </>
                    )}
                  </Button>
                </form>

                {error ? (
                  <p className="mt-3 text-sm text-red-500 dark:text-red-300">
                    {error}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            {featurePills.map((pill) => (
              <span
                key={pill}
                className="glass rounded-full px-4 py-2 text-sm text-muted-foreground transition duration-300 hover:-translate-y-0.5"
              >
                {pill}
              </span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.28 }}
            className="mt-12 grid w-full gap-4 md:grid-cols-3"
          >
            {[
              {
                title: "Fast Audit Flow",
                body: "Enter a URL and get a clean dashboard with immediate SEO and AI visibility signals.",
              },
              {
                title: "Built for GEO",
                body: "Surface content and entity opportunities that help brands appear in AI-generated answers.",
              },
              {
                title: "Minimal by Design",
                body: "A polished SaaS landing experience with glass cards, motion, and strong mobile behavior.",
              },
            ].map((item) => (
              <Card
                key={item.title}
                className="transition duration-300 hover:-translate-y-1 hover:shadow-glow"
              >
                <CardContent className="space-y-3 p-6 text-left">
                  <h2 className="font-display text-xl font-bold">{item.title}</h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {item.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>

        {loading ? (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mt-10 max-w-2xl"
          >
            <Card className="glass-strong">
              <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
                <div className="relative flex h-20 w-20 items-center justify-center">
                  <motion.div
                    className="absolute inset-0 rounded-full border border-amber-400/25"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.55, 0.2, 0.55] }}
                    transition={{ duration: 2.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="absolute inset-2 rounded-full border-2 border-transparent border-t-amber-500 border-r-amber-300"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.15, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  />
                  <div className="glass flex h-12 w-12 items-center justify-center rounded-full">
                    <LoaderCircle className="h-5 w-5 animate-spin text-amber-500" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-display text-2xl font-bold">
                    Running your audit
                  </h3>
                  <div className="mx-auto flex min-h-7 items-center justify-center">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.p
                        key={loadingMessages[loadingMessageIndex]}
                        initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="text-sm leading-6 text-muted-foreground"
                      >
                        {loadingMessages[loadingMessageIndex]}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                  <p className="max-w-xl text-xs uppercase tracking-[0.28em] text-muted-foreground/80">
                    Live analysis in progress
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}

        {report ? <AuditDashboard report={report} /> : null}
      </section>
    </main>
  );
}
