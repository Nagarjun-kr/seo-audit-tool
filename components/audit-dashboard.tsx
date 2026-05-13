"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Bot,
  FileText,
  Search,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";

import type {
  AuditIssue,
  EnrichedAuditResponse,
} from "@/lib/audit";
import { ScoreRing } from "@/components/score-ring";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

const scoreCards = [
  {
    key: "technical",
    label: "Technical SEO",
    icon: Wrench,
  },
  {
    key: "content",
    label: "Content Quality",
    icon: FileText,
  },
  {
    key: "aiVisibility",
    label: "AI Visibility",
    icon: Bot,
  },
  {
    key: "overall",
    label: "Overall Score",
    icon: Search,
  },
] as const;

const dashboardTabs = [
  { id: "overview", label: "Overview", icon: Search },
  { id: "technical", label: "Technical SEO", icon: Wrench },
  { id: "content", label: "Content Quality", icon: FileText },
  { id: "ai-visibility", label: "AI Visibility", icon: Bot },
  { id: "recommendations", label: "Recommendations", icon: Sparkles },
] as const;

type DashboardTabId = (typeof dashboardTabs)[number]["id"];

const severityClasses = {
  high: "border border-red-500/20 bg-red-500/12 text-red-700 dark:border-red-400/20 dark:text-red-300",
  medium:
    "border border-amber-500/20 bg-amber-500/12 text-amber-700 dark:border-amber-400/20 dark:text-amber-300",
  low: "border border-sky-500/20 bg-sky-500/12 text-sky-700 dark:border-sky-400/20 dark:text-sky-300",
};

export function AuditDashboard({ report }: { report: EnrichedAuditResponse }) {
  const [activeTab, setActiveTab] = useState<DashboardTabId>("overview");

  const allIssues = useMemo(
    () => [
      ...report.technicalIssues,
      ...report.contentIssues,
      ...report.aiVisibilityIssues,
    ],
    [report],
  );

  const aiRecommendationMap = useMemo(
    () =>
      new Map(
        report.aiInsights.issueRecommendations.map((item) => [item.issueCode, item]),
      ),
    [report.aiInsights.issueRecommendations],
  );

  const tabPanels: Record<DashboardTabId, React.ReactNode> = {
    overview: (
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardContent className="space-y-5 p-6 md:p-8">
            <SectionHeading
              icon={AlertTriangle}
              title="Priority Findings"
              description="A cross-section of the most important issues found on the page."
            />
            <IssueList issues={allIssues} aiRecommendationMap={aiRecommendationMap} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <AiGuidanceCard report={report} />
          <PageSignalsCard report={report} />
        </div>
      </div>
    ),
    technical: (
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card>
          <CardContent className="space-y-5 p-6 md:p-8">
            <SectionHeading
              icon={Wrench}
              title="Technical SEO"
              description="Metadata, crawl signals, mobile readiness, and on-page technical hygiene."
            />
            <IssueList
              issues={report.technicalIssues}
              aiRecommendationMap={aiRecommendationMap}
              emptyMessage="No technical SEO issues were detected by the current rules."
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <MetricCard
            title="Technical Snapshot"
            items={[
              `Title length: ${report.metadata.title.length || 0} characters`,
              `Meta description length: ${report.metadata.metaDescription.length || 0} characters`,
              `Canonical tag: ${report.metadata.canonicalUrl ? "Present" : "Missing"}`,
              `Viewport tag: ${report.metadata.viewport ? "Present" : "Missing"}`,
              `Images missing alt text: ${report.metadata.missingImageAltCount}`,
            ]}
          />
          <AiGuidanceCard report={report} />
        </div>
      </div>
    ),
    content: (
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card>
          <CardContent className="space-y-5 p-6 md:p-8">
            <SectionHeading
              icon={FileText}
              title="Content Quality"
              description="Structure, readability, depth, and content hierarchy across the page."
            />
            <IssueList
              issues={report.contentIssues}
              aiRecommendationMap={aiRecommendationMap}
              emptyMessage="No content quality issues were detected by the current rules."
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <MetricCard
            title="Content Signals"
            items={[
              `Headings found: ${report.metadata.h1s.length} H1 / ${report.metadata.h2s.length} H2`,
              `Paragraph word count: ${report.metadata.wordCount}`,
              `Long paragraphs: ${report.metadata.longParagraphCount}`,
              `FAQ-style headings: ${report.metadata.faqHeadings.length}`,
            ]}
          />
          <RecommendationsCard report={report} title="Content Actions" />
        </div>
      </div>
    ),
    "ai-visibility": (
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card>
          <CardContent className="space-y-5 p-6 md:p-8">
            <SectionHeading
              icon={Bot}
              title="AI Visibility"
              description="Question coverage, internal linking, and answer-engine friendliness."
            />
            <IssueList
              issues={report.aiVisibilityIssues}
              aiRecommendationMap={aiRecommendationMap}
              emptyMessage="No AI visibility issues were detected by the current rules."
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <AiGuidanceCard report={report} />
          <MetricCard
            title="Answer Engine Signals"
            items={[
              `Internal links: ${report.metadata.internalLinkCount}`,
              `External links: ${report.metadata.externalLinkCount}`,
              `FAQ headings found: ${report.metadata.faqHeadings.length}`,
              `AI visibility score: ${report.scoreBreakdown.aiVisibility}`,
            ]}
          />
        </div>
      </div>
    ),
    recommendations: (
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <RecommendationsCard report={report} title="Recommended Next Steps" />
        <AiGuidanceCard report={report} expanded />
      </div>
    ),
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="mx-auto mt-12 w-full max-w-6xl space-y-6"
    >
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col gap-6 p-8 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
              Live Audit Snapshot
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Analyzed URL</p>
              <h2 className="mt-1 break-all font-display text-2xl font-bold md:text-3xl">
                {report.metadata.url}
              </h2>
            </div>
          </div>

          <ScoreRing score={report.score} size={148} strokeWidth={12} label="Score" />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {scoreCards.map(({ key, label, icon: Icon }, index) => {
          const score = report.scoreBreakdown[key];

          return (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * index, duration: 0.35 }}
            >
              <Card className="h-full transition duration-300 hover:-translate-y-1">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-amber-600 dark:text-amber-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-semibold",
                        score <= 49
                          ? "border-red-500/20 bg-red-500/12 text-red-700 dark:border-red-400/20 dark:text-red-300"
                          : score <= 79
                            ? "border-amber-500/20 bg-amber-500/12 text-amber-700 dark:border-amber-400/20 dark:text-amber-300"
                            : "border-emerald-500/20 bg-emerald-500/12 text-emerald-700 dark:border-emerald-400/20 dark:text-emerald-300",
                      )}
                    >
                      {score <= 49 ? "Poor" : score <= 79 ? "Needs Work" : "Strong"}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="font-display text-4xl font-bold">{score}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <CardContent className="space-y-6 p-4 sm:p-5 md:p-6">
          <div className="glass rounded-[28px] p-2">
            <div className="flex flex-wrap gap-2">
              {dashboardTabs.map(({ id, label, icon: Icon }) => {
                const active = activeTab === id;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={cn(
                      "relative inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition duration-300 sm:flex-none",
                      active
                        ? "text-foreground"
                        : "text-muted-foreground hover:bg-white/45 hover:text-foreground dark:hover:bg-white/8",
                    )}
                  >
                    {active ? (
                      <motion.span
                        layoutId="audit-tab-active"
                        className="absolute inset-0 rounded-2xl bg-white shadow-lg shadow-black/5 dark:bg-white/10"
                        transition={{ type: "spring", stiffness: 280, damping: 28 }}
                      />
                    ) : null}
                    <span className="relative z-10 inline-flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{label}</span>
                      <span className="sm:hidden">{mobileTabLabel(label)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              {tabPanels[activeTab]}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.section>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof AlertTriangle;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-amber-600 dark:text-amber-300">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-display text-xl font-bold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function AiGuidanceCard({
  report,
  expanded = false,
}: {
  report: EnrichedAuditResponse;
  expanded?: boolean;
}) {
  return (
    <Card>
      <CardContent className={cn("space-y-4 p-6", expanded && "md:p-8")}>
        <SectionHeading
          icon={Sparkles}
          title="AI SEO Guidance"
          description={
            report.aiInsights.generated
              ? `Generated with ${report.aiInsights.provider} ${report.aiInsights.model ?? ""}`.trim()
              : "Using fallback guidance because AI enrichment was unavailable."
          }
        />
        <div className="rounded-3xl border border-white/20 bg-white/45 p-4 text-sm leading-6 text-muted-foreground dark:border-white/10 dark:bg-white/5">
          {report.aiInsights.summary}
        </div>
        {!report.aiInsights.generated && report.aiInsights.fallbackReason ? (
          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-800 dark:text-amber-200">
            Fallback reason: {report.aiInsights.fallbackReason}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function PageSignalsCard({ report }: { report: EnrichedAuditResponse }) {
  return (
    <MetricCard
      title="Page Signals"
      items={[
        `Title length: ${report.metadata.title.length || 0} characters`,
        `Meta description length: ${report.metadata.metaDescription.length || 0} characters`,
        `Headings found: ${report.metadata.h1s.length} H1 / ${report.metadata.h2s.length} H2`,
        `Links found: ${report.metadata.internalLinkCount} internal / ${report.metadata.externalLinkCount} external`,
        `Images missing alt text: ${report.metadata.missingImageAltCount}`,
        `Paragraph word count: ${report.metadata.wordCount}`,
      ]}
    />
  );
}

function MetricCard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <h3 className="font-display text-xl font-bold">{title}</h3>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item}
              className="rounded-3xl border border-white/20 bg-white/45 p-4 text-sm leading-6 text-muted-foreground dark:border-white/10 dark:bg-white/5"
            >
              {item}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationsCard({
  report,
  title,
}: {
  report: EnrichedAuditResponse;
  title: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-6 md:p-8">
        <h3 className="font-display text-xl font-bold">{title}</h3>
        <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
          {report.recommendations.map((recommendation) => (
            <li
              key={recommendation}
              className="rounded-3xl border border-white/20 bg-white/45 p-4 dark:border-white/10 dark:bg-white/5"
            >
              {recommendation}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function IssueList({
  issues,
  aiRecommendationMap,
  emptyMessage = "No major issues were detected by the current audit rules.",
}: {
  issues: AuditIssue[];
  aiRecommendationMap: Map<string, EnrichedAuditResponse["aiInsights"]["issueRecommendations"][number]>;
  emptyMessage?: string;
}) {
  if (issues.length === 0) {
    return (
      <div className="rounded-3xl border border-white/20 bg-white/45 p-4 dark:border-white/10 dark:bg-white/5">
        <p className="text-sm leading-6 text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {issues.map((issue, index) => (
        <motion.div
          key={issue.code}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 * index, duration: 0.28 }}
          className={cn(
            "group relative overflow-hidden rounded-[30px] border bg-white/60 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_70px_rgba(15,23,42,0.1)] dark:bg-white/6",
            issue.severity === "high" && "border-red-400/18 hover:border-red-400/30",
            issue.severity === "medium" && "border-amber-400/20 hover:border-amber-400/35",
            issue.severity === "low" && "border-sky-400/18 hover:border-sky-400/30",
          )}
        >
          <div
            className={cn(
              "absolute inset-x-0 top-0 h-px opacity-80 transition duration-300 group-hover:opacity-100",
              issue.severity === "high" && "bg-red-400/60",
              issue.severity === "medium" && "bg-amber-400/70",
              issue.severity === "low" && "bg-sky-400/70",
            )}
          />

          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
                {issue.category.replace("-", " ")}
              </p>
              <h4 className="font-display text-xl font-bold leading-tight">
                {issue.title}
              </h4>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em]",
                severityClasses[issue.severity],
              )}
            >
              {issue.severity}
            </span>
          </div>

          <p className="text-[15px] leading-7 text-muted-foreground">
            {issue.description}
          </p>

          {aiRecommendationMap.get(issue.code) ? (
            <div className="mt-5 space-y-3 rounded-[24px] border border-primary/15 bg-primary/6 p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                AI Recommendation
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                <span className="font-semibold text-foreground">Why it matters:</span>{" "}
                {aiRecommendationMap.get(issue.code)?.whyItMatters}
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                <span className="font-semibold text-foreground">SEO impact:</span>{" "}
                {aiRecommendationMap.get(issue.code)?.seoImpact}
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                <span className="font-semibold text-foreground">Fix:</span>{" "}
                {aiRecommendationMap.get(issue.code)?.actionableFix}
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                <span className="font-semibold text-foreground">Example:</span>{" "}
                {aiRecommendationMap.get(issue.code)?.exampleImprovement}
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                <span className="font-semibold text-foreground">Priority:</span>{" "}
                {aiRecommendationMap.get(issue.code)?.priorityExplanation}
              </p>
            </div>
          ) : null}
        </motion.div>
      ))}
    </div>
  );
}

function mobileTabLabel(label: string) {
  if (label === "Technical SEO") {
    return "Technical";
  }

  if (label === "Content Quality") {
    return "Content";
  }

  if (label === "AI Visibility") {
    return "AI";
  }

  if (label === "Recommendations") {
    return "Tips";
  }

  return label;
}
