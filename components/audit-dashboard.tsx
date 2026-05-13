"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bot,
  ChevronDown,
  CircleDot,
  FileText,
  Gauge,
  Globe2,
  Link2,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import type {
  AuditIssue,
  AuditIssueSeverity,
  EnrichedAuditResponse,
} from "@/lib/audit";
import { ScoreRing } from "@/components/score-ring";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const dashboardTabs = [
  { id: "overview", label: "Overview", icon: Search },
  { id: "technical", label: "Technical SEO", icon: Wrench },
  { id: "content", label: "Content Quality", icon: FileText },
  { id: "ai-visibility", label: "AI Visibility", icon: Bot },
  { id: "performance", label: "Performance", icon: Gauge },
  { id: "geo", label: "GEO Optimization", icon: Globe2 },
  { id: "links", label: "Links & Authority", icon: Link2 },
] as const;

const scoreCards = [
  {
    key: "technical",
    label: "Technical Health",
    icon: Wrench,
    insight: "Metadata, crawl signals, canonical hygiene, and mobile readiness.",
  },
  {
    key: "content",
    label: "Content Quality",
    icon: FileText,
    insight: "Structure, topical depth, headings, readability, and page substance.",
  },
  {
    key: "aiVisibility",
    label: "AI Visibility",
    icon: Bot,
    insight: "Answer readiness, FAQ coverage, internal context, and GEO signals.",
  },
  {
    key: "overall",
    label: "Overall Score",
    icon: Search,
    insight: "Weighted blend of technical, content, and AI visibility health.",
  },
] as const;

const severities = ["high", "medium", "low"] as const;

type DashboardTabId = (typeof dashboardTabs)[number]["id"];
type SeverityFilter = AuditIssueSeverity | "all";

const severityStyles: Record<
  AuditIssueSeverity,
  {
    label: string;
    accent: string;
    badge: string;
    line: string;
    dot: string;
    shadow: string;
  }
> = {
  high: {
    label: "High Priority",
    accent: "text-rose-600 dark:text-rose-300",
    badge:
      "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:border-rose-300/20 dark:text-rose-200",
    line: "from-rose-400/70 via-rose-400/20 to-transparent",
    dot: "bg-rose-500",
    shadow: "hover:shadow-[0_24px_80px_rgba(244,63,94,0.14)]",
  },
  medium: {
    label: "Medium Priority",
    accent: "text-amber-600 dark:text-amber-300",
    badge:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-300/20 dark:text-amber-200",
    line: "from-amber-400/80 via-amber-400/20 to-transparent",
    dot: "bg-amber-500",
    shadow: "hover:shadow-[0_24px_80px_rgba(245,158,11,0.14)]",
  },
  low: {
    label: "Low Priority",
    accent: "text-sky-600 dark:text-sky-300",
    badge:
      "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:border-sky-300/20 dark:text-sky-200",
    line: "from-sky-400/80 via-sky-400/20 to-transparent",
    dot: "bg-sky-500",
    shadow: "hover:shadow-[0_24px_80px_rgba(14,165,233,0.14)]",
  },
};

const tabCategoryMap: Partial<Record<DashboardTabId, AuditIssue["category"]>> = {
  technical: "technical",
  content: "content",
  "ai-visibility": "ai-visibility",
  geo: "ai-visibility",
};

export function AuditDashboard({ report }: { report: EnrichedAuditResponse }) {
  const [activeTab, setActiveTab] = useState<DashboardTabId>("overview");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [expandedIssueCode, setExpandedIssueCode] = useState<string | null>(
    report.technicalIssues[0]?.code ??
      report.contentIssues[0]?.code ??
      report.aiVisibilityIssues[0]?.code ??
      null,
  );
  const issuesRef = useRef<HTMLDivElement>(null);

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

  const issueCounts = useMemo(
    () =>
      severities.reduce(
        (counts, severity) => ({
          ...counts,
          [severity]: allIssues.filter((issue) => issue.severity === severity)
            .length,
        }),
        { high: 0, medium: 0, low: 0 },
      ),
    [allIssues],
  );

  const activeIssues = useMemo(() => {
    const category = tabCategoryMap[activeTab];
    const source = category
      ? allIssues.filter((issue) => issue.category === category)
      : activeTab === "links"
        ? allIssues.filter(
            (issue) =>
              issue.code.includes("link") ||
              issue.code.includes("canonical") ||
              issue.category === "ai-visibility",
          )
        : activeTab === "performance"
          ? allIssues.filter(
              (issue) =>
                issue.code.includes("viewport") ||
                issue.category === "technical" ||
                issue.category === "content",
            )
          : allIssues;

    return severityFilter === "all"
      ? source
      : source.filter((issue) => issue.severity === severityFilter);
  }, [activeTab, allIssues, severityFilter]);

  const fixesBySeverity = useMemo(
    () =>
      severities.map((severity) => ({
        severity,
        issues: allIssues.filter((issue) => issue.severity === severity),
      })),
    [allIssues],
  );

  function focusIssue(issue: AuditIssue) {
    setActiveTab(issue.category);
    setSeverityFilter(issue.severity);
    setExpandedIssueCode(issue.code);
    window.setTimeout(() => {
      issuesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative mx-auto mt-12 w-full max-w-7xl space-y-6"
    >
      <div className="pointer-events-none absolute -left-20 top-16 -z-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-40 -z-10 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

      <ResultsHero report={report} issueCounts={issueCounts} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {scoreCards.map((card, index) => (
          <ScoreInsightCard
            key={card.key}
            index={index}
            title={card.label}
            icon={card.icon}
            score={report.scoreBreakdown[card.key]}
            insight={card.insight}
          />
        ))}
      </div>

      <Card className="overflow-hidden rounded-[32px]">
        <CardContent className="space-y-6 p-3 sm:p-4 md:p-5">
          <TabNav activeTab={activeTab} onChange={setActiveTab} />

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              {activeTab === "overview" ? (
                <OverviewPanel
                  report={report}
                  allIssues={allIssues}
                  activeIssues={activeIssues}
                  aiRecommendationMap={aiRecommendationMap}
                  expandedIssueCode={expandedIssueCode}
                  setExpandedIssueCode={setExpandedIssueCode}
                  severityFilter={severityFilter}
                  setSeverityFilter={setSeverityFilter}
                  fixesBySeverity={fixesBySeverity}
                  focusIssue={focusIssue}
                  issuesRef={issuesRef}
                />
              ) : activeTab === "performance" ? (
                <PerformancePanel report={report} issues={activeIssues} />
              ) : activeTab === "geo" ? (
                <GeoPanel
                  report={report}
                  issues={activeIssues}
                  aiRecommendationMap={aiRecommendationMap}
                  expandedIssueCode={expandedIssueCode}
                  setExpandedIssueCode={setExpandedIssueCode}
                  severityFilter={severityFilter}
                  setSeverityFilter={setSeverityFilter}
                  issuesRef={issuesRef}
                />
              ) : activeTab === "links" ? (
                <LinksPanel report={report} issues={activeIssues} />
              ) : (
                <AuditCategoryPanel
                  tabId={activeTab}
                  report={report}
                  issues={activeIssues}
                  aiRecommendationMap={aiRecommendationMap}
                  expandedIssueCode={expandedIssueCode}
                  setExpandedIssueCode={setExpandedIssueCode}
                  severityFilter={severityFilter}
                  setSeverityFilter={setSeverityFilter}
                  issuesRef={issuesRef}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.section>
  );
}

function ResultsHero({
  report,
  issueCounts,
}: {
  report: EnrichedAuditResponse;
  issueCounts: Record<AuditIssueSeverity, number>;
}) {
  const scoreLabel = getScoreLabel(report.score);

  return (
    <Card className="relative overflow-hidden rounded-[34px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(59,130,246,0.13),transparent_32%),radial-gradient(circle_at_85%_20%,rgba(139,92,246,0.12),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.70),rgba(255,255,255,0.36))] dark:bg-[radial-gradient(circle_at_15%_10%,rgba(59,130,246,0.14),transparent_32%),radial-gradient(circle_at_85%_20%,rgba(139,92,246,0.12),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]" />
      <CardContent className="relative grid gap-8 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:p-8">
        <div className="min-w-0 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/8 dark:text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              EFFIX Live Audit
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-200">
              <CircleDot className="h-3.5 w-3.5 fill-current" />
              {report.metadata.statusCode} crawled
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Analyzed URL
            </p>
            <h2 className="break-all font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              {report.metadata.url}
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Premium SEO, content, link, and AI visibility intelligence for{" "}
              <span className="font-semibold text-foreground">
                {report.metadata.hostname}
              </span>
              .
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <HeroStat
              label="AI Visibility"
              value={report.scoreBreakdown.aiVisibility}
              suffix="/100"
              tone="blue"
            />
            <HeroStat
              label="Technical Health"
              value={report.scoreBreakdown.technical}
              suffix="/100"
              tone="emerald"
            />
            <HeroStat
              label="Content Quality"
              value={report.scoreBreakdown.content}
              suffix="/100"
              tone="amber"
            />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 lg:min-w-[230px]">
          <ScoreRing
            score={report.score}
            size={170}
            strokeWidth={13}
            label="Overall"
            className="w-full max-w-[230px]"
          />
          <div className="grid w-full grid-cols-3 gap-2">
            {severities.map((severity) => (
              <div
                key={severity}
                className="rounded-2xl border border-white/60 bg-white/55 p-3 text-center shadow-sm shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/6"
              >
                <p
                  className={cn(
                    "font-display text-xl font-bold",
                    severityStyles[severity].accent,
                  )}
                >
                  {issueCounts[severity]}
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {severity}
                </p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            {scoreLabel} audit posture
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function HeroStat({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: number;
  suffix: string;
  tone: "blue" | "emerald" | "amber";
}) {
  const toneClasses = {
    blue: "from-blue-500 to-violet-500",
    emerald: "from-emerald-500 to-teal-500",
    amber: "from-amber-400 to-orange-400",
  };

  return (
    <div className="rounded-3xl border border-white/60 bg-white/55 p-4 shadow-sm shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="font-display text-3xl font-bold">
        {value}
        <span className="text-sm text-muted-foreground">{suffix}</span>
      </p>
      <div className="mt-3 h-1.5 rounded-full bg-slate-950/8 dark:bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className={cn("h-full rounded-full bg-gradient-to-r", toneClasses[tone])}
        />
      </div>
    </div>
  );
}

function ScoreInsightCard({
  title,
  icon: Icon,
  score,
  insight,
  index,
}: {
  title: string;
  icon: LucideIcon;
  score: number;
  insight: string;
  index: number;
}) {
  const trend = buildTrend(score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 * index, duration: 0.35 }}
      className="group"
    >
      <Card className="h-full overflow-hidden rounded-[28px] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_80px_rgba(15,23,42,0.11)] dark:hover:shadow-[0_26px_80px_rgba(0,0,0,0.28)]">
        <CardContent className="relative space-y-5 p-5">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
          <div className="flex items-start justify-between gap-4">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/60 bg-white/70 text-blue-600 shadow-sm shadow-black/5 dark:border-white/10 dark:bg-white/8 dark:text-blue-300">
              <Icon className="h-5 w-5" />
            </div>
            <ScoreBadge score={score} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 font-display text-4xl font-bold tracking-tight">
              {score}
            </p>
          </div>
          <MiniChart values={trend} />
          <div className="grid gap-2 opacity-100 transition duration-300 sm:min-h-[60px]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Score explanation
            </p>
            <p className="text-sm leading-6 text-muted-foreground">{insight}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TabNav({
  activeTab,
  onChange,
}: {
  activeTab: DashboardTabId;
  onChange: (tab: DashboardTabId) => void;
}) {
  return (
    <div className="rounded-[26px] border border-white/60 bg-white/55 p-2 shadow-sm shadow-black/5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {dashboardTabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                "relative flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-[20px] px-3 py-3 text-sm font-semibold transition duration-300",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-white/60 hover:text-foreground dark:hover:bg-white/8",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="effix-tab-active"
                  className="absolute inset-0 rounded-[20px] border border-white/70 bg-white shadow-lg shadow-black/5 dark:border-white/10 dark:bg-white/12"
                  transition={{ type: "spring", stiffness: 280, damping: 30 }}
                />
              ) : null}
              <span className="relative z-10 inline-flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{mobileTabLabel(label)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OverviewPanel({
  report,
  allIssues,
  activeIssues,
  aiRecommendationMap,
  expandedIssueCode,
  setExpandedIssueCode,
  severityFilter,
  setSeverityFilter,
  fixesBySeverity,
  focusIssue,
  issuesRef,
}: {
  report: EnrichedAuditResponse;
  allIssues: AuditIssue[];
  activeIssues: AuditIssue[];
  aiRecommendationMap: Map<string, EnrichedAuditResponse["aiInsights"]["issueRecommendations"][number]>;
  expandedIssueCode: string | null;
  setExpandedIssueCode: (code: string | null) => void;
  severityFilter: SeverityFilter;
  setSeverityFilter: (severity: SeverityFilter) => void;
  fixesBySeverity: Array<{ severity: AuditIssueSeverity; issues: AuditIssue[] }>;
  focusIssue: (issue: AuditIssue) => void;
  issuesRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <div className="space-y-6">
        <PriorityIssuesPanel
          title="Priority Issues"
          description="Filter, expand, and work through the issues that most affect search and AI visibility."
          issues={activeIssues}
          allIssues={allIssues}
          aiRecommendationMap={aiRecommendationMap}
          expandedIssueCode={expandedIssueCode}
          setExpandedIssueCode={setExpandedIssueCode}
          severityFilter={severityFilter}
          setSeverityFilter={setSeverityFilter}
          issuesRef={issuesRef}
        />
        <FixesByPriorityPanel groups={fixesBySeverity} onViewFix={focusIssue} />
      </div>

      <div className="space-y-6">
        <AiInsightsPanel report={report} allIssues={allIssues} onViewFix={focusIssue} />
        <PageSignalsCard report={report} />
      </div>
    </div>
  );
}

function AuditCategoryPanel({
  tabId,
  report,
  issues,
  aiRecommendationMap,
  expandedIssueCode,
  setExpandedIssueCode,
  severityFilter,
  setSeverityFilter,
  issuesRef,
}: {
  tabId: Exclude<DashboardTabId, "overview" | "performance" | "geo" | "links">;
  report: EnrichedAuditResponse;
  issues: AuditIssue[];
  aiRecommendationMap: Map<string, EnrichedAuditResponse["aiInsights"]["issueRecommendations"][number]>;
  expandedIssueCode: string | null;
  setExpandedIssueCode: (code: string | null) => void;
  severityFilter: SeverityFilter;
  setSeverityFilter: (severity: SeverityFilter) => void;
  issuesRef: React.RefObject<HTMLDivElement | null>;
}) {
  const config = {
    technical: {
      icon: Wrench,
      title: "Technical SEO",
      description:
        "Crawl readiness, metadata integrity, canonical signals, accessibility, and mobile fundamentals.",
      score: report.scoreBreakdown.technical,
      metrics: [
        ["Title length", `${report.metadata.title.length || 0} chars`],
        ["Meta description", `${report.metadata.metaDescription.length || 0} chars`],
        ["Canonical", report.metadata.canonicalUrl ? "Present" : "Missing"],
        ["Viewport", report.metadata.viewport ? "Present" : "Missing"],
      ],
    },
    content: {
      icon: FileText,
      title: "Content Quality",
      description:
        "Topical depth, heading clarity, readable structure, and page substance.",
      score: report.scoreBreakdown.content,
      metrics: [
        ["H1 / H2 structure", `${report.metadata.h1s.length} / ${report.metadata.h2s.length}`],
        ["Word count", report.metadata.wordCount.toLocaleString()],
        ["Long paragraphs", String(report.metadata.longParagraphCount)],
        ["FAQ headings", String(report.metadata.faqHeadings.length)],
      ],
    },
    "ai-visibility": {
      icon: Bot,
      title: "AI Visibility",
      description:
        "Answer-engine readiness, direct response coverage, contextual links, and entity clarity.",
      score: report.scoreBreakdown.aiVisibility,
      metrics: [
        ["FAQ headings", String(report.metadata.faqHeadings.length)],
        ["Internal links", String(report.metadata.internalLinkCount)],
        ["External links", String(report.metadata.externalLinkCount)],
        ["AI score", `${report.scoreBreakdown.aiVisibility}/100`],
      ],
    },
  }[tabId];

  return (
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <div className="space-y-6">
        <CategoryHealthCard {...config} />
        <MetricGrid metrics={config.metrics as Array<[string, string]>} />
      </div>
      <PriorityIssuesPanel
        title={`${config.title} Findings`}
        description={config.description}
        issues={issues}
        allIssues={issues}
        aiRecommendationMap={aiRecommendationMap}
        expandedIssueCode={expandedIssueCode}
        setExpandedIssueCode={setExpandedIssueCode}
        severityFilter={severityFilter}
        setSeverityFilter={setSeverityFilter}
        issuesRef={issuesRef}
      />
    </div>
  );
}

function PerformancePanel({
  report,
  issues,
}: {
  report: EnrichedAuditResponse;
  issues: AuditIssue[];
}) {
  const performanceSignals = [
    {
      label: "Crawl Response",
      value: report.metadata.statusCode >= 200 && report.metadata.statusCode < 400 ? 96 : 52,
      detail: `HTTP ${report.metadata.statusCode}`,
    },
    {
      label: "Mobile Readiness",
      value: report.metadata.viewport ? 94 : 42,
      detail: report.metadata.viewport ? "Viewport detected" : "Viewport missing",
    },
    {
      label: "Content Load",
      value: Math.min(100, Math.max(45, Math.round(report.metadata.wordCount / 8))),
      detail: `${report.metadata.wordCount.toLocaleString()} words parsed`,
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <Card className="rounded-[30px]">
        <CardContent className="space-y-6 p-6">
          <SectionHeading
            icon={Gauge}
            title="Performance Signals"
            description="Derived from the live crawl response and parsed page health signals."
          />
          <div className="space-y-4">
            {performanceSignals.map((signal) => (
              <ProgressSignal key={signal.label} {...signal} />
            ))}
          </div>
          <AnalyticsStrip
            items={[
              ["Fetched", new Date(report.metadata.fetchedAt).toLocaleString()],
              ["Images", String(report.metadata.imageCount)],
              ["Missing alt", String(report.metadata.missingImageAltCount)],
            ]}
          />
        </CardContent>
      </Card>
      <Card className="rounded-[30px]">
        <CardContent className="space-y-5 p-6">
          <SectionHeading
            icon={Activity}
            title="Health Indicators"
            description="Technical and content factors most likely to affect experience quality."
          />
          <div className="space-y-3">
            {(issues.length ? issues : report.technicalIssues).slice(0, 5).map((issue) => (
              <CompactIssue key={issue.code} issue={issue} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GeoPanel({
  report,
  issues,
  aiRecommendationMap,
  expandedIssueCode,
  setExpandedIssueCode,
  severityFilter,
  setSeverityFilter,
  issuesRef,
}: {
  report: EnrichedAuditResponse;
  issues: AuditIssue[];
  aiRecommendationMap: Map<string, EnrichedAuditResponse["aiInsights"]["issueRecommendations"][number]>;
  expandedIssueCode: string | null;
  setExpandedIssueCode: (code: string | null) => void;
  severityFilter: SeverityFilter;
  setSeverityFilter: (severity: SeverityFilter) => void;
  issuesRef: React.RefObject<HTMLDivElement | null>;
}) {
  const geoSuggestions = [
    {
      title: "Direct answer coverage",
      value: report.metadata.wordCount >= 450 ? "Healthy" : "Needs depth",
      score: report.metadata.wordCount >= 450 ? 88 : 54,
    },
    {
      title: "Question-led sections",
      value: `${report.metadata.faqHeadings.length} found`,
      score: report.metadata.faqHeadings.length > 0 ? 90 : 46,
    },
    {
      title: "Contextual internal links",
      value: `${report.metadata.internalLinkCount} internal`,
      score: Math.min(100, 45 + report.metadata.internalLinkCount * 12),
    },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="rounded-[30px]">
        <CardContent className="space-y-5 p-6">
          <SectionHeading
            icon={Globe2}
            title="GEO Optimization"
            description="Generative engine optimization opportunities built from live page signals."
          />
          {geoSuggestions.map((suggestion) => (
            <ProgressSignal
              key={suggestion.title}
              label={suggestion.title}
              value={suggestion.score}
              detail={suggestion.value}
            />
          ))}
          <RecommendationsList
            title="GEO Suggestions"
            items={[
              "Add concise answer blocks near the top of the page.",
              "Use question-led headings for common customer intent.",
              "Connect the page to supporting guides, comparisons, and proof pages.",
            ]}
          />
        </CardContent>
      </Card>
      <PriorityIssuesPanel
        title="AI Visibility & GEO Findings"
        description="Issues that can reduce answer-engine confidence and AI summary eligibility."
        issues={issues}
        allIssues={report.aiVisibilityIssues}
        aiRecommendationMap={aiRecommendationMap}
        expandedIssueCode={expandedIssueCode}
        setExpandedIssueCode={setExpandedIssueCode}
        severityFilter={severityFilter}
        setSeverityFilter={setSeverityFilter}
        issuesRef={issuesRef}
      />
    </div>
  );
}

function LinksPanel({
  report,
  issues,
}: {
  report: EnrichedAuditResponse;
  issues: AuditIssue[];
}) {
  const totalLinks = report.metadata.internalLinkCount + report.metadata.externalLinkCount;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="rounded-[30px]">
        <CardContent className="space-y-6 p-6">
          <SectionHeading
            icon={Link2}
            title="Links & Authority"
            description="Internal context, external references, and authority flow signals."
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniMetric label="Internal" value={report.metadata.internalLinkCount} />
            <MiniMetric label="External" value={report.metadata.externalLinkCount} />
            <MiniMetric label="Total" value={totalLinks} />
          </div>
          <ProgressSignal
            label="Internal Link Coverage"
            value={Math.min(100, 35 + report.metadata.internalLinkCount * 14)}
            detail={`${report.metadata.internalLinkCount} contextual links detected`}
          />
          <ProgressSignal
            label="Outbound Reference Mix"
            value={Math.min(100, 55 + report.metadata.externalLinkCount * 9)}
            detail={`${report.metadata.externalLinkCount} external links detected`}
          />
        </CardContent>
      </Card>
      <Card className="rounded-[30px]">
        <CardContent className="space-y-5 p-6">
          <SectionHeading
            icon={ShieldCheck}
            title="Authority Recommendations"
            description="Actionable link improvements from the current page structure."
          />
          <div className="space-y-3">
            {(issues.length ? issues : report.aiVisibilityIssues).map((issue) => (
              <CompactIssue key={issue.code} issue={issue} />
            ))}
          </div>
          <RecommendationsList
            title="Link Strategy"
            items={[
              "Point to related product, comparison, and education pages with descriptive anchors.",
              "Add supporting external citations only where they strengthen trust and clarity.",
              "Use internal links to reinforce entity relationships for both search and AI systems.",
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function PriorityIssuesPanel({
  title,
  description,
  issues,
  allIssues,
  aiRecommendationMap,
  expandedIssueCode,
  setExpandedIssueCode,
  severityFilter,
  setSeverityFilter,
  issuesRef,
}: {
  title: string;
  description: string;
  issues: AuditIssue[];
  allIssues: AuditIssue[];
  aiRecommendationMap: Map<string, EnrichedAuditResponse["aiInsights"]["issueRecommendations"][number]>;
  expandedIssueCode: string | null;
  setExpandedIssueCode: (code: string | null) => void;
  severityFilter: SeverityFilter;
  setSeverityFilter: (severity: SeverityFilter) => void;
  issuesRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <Card className="rounded-[30px]">
      <div ref={issuesRef}>
        <CardContent className="space-y-5 p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <SectionHeading icon={AlertTriangle} title={title} description={description} />
            <SeverityFilterBar
              value={severityFilter}
              onChange={setSeverityFilter}
              issues={allIssues}
            />
          </div>

          <IssueList
            issues={issues}
            aiRecommendationMap={aiRecommendationMap}
            expandedIssueCode={expandedIssueCode}
            setExpandedIssueCode={setExpandedIssueCode}
          />
        </CardContent>
      </div>
    </Card>
  );
}

function IssueList({
  issues,
  aiRecommendationMap,
  expandedIssueCode,
  setExpandedIssueCode,
}: {
  issues: AuditIssue[];
  aiRecommendationMap: Map<string, EnrichedAuditResponse["aiInsights"]["issueRecommendations"][number]>;
  expandedIssueCode: string | null;
  setExpandedIssueCode: (code: string | null) => void;
}) {
  if (issues.length === 0) {
    return (
      <div className="rounded-[24px] border border-white/60 bg-white/55 p-5 text-sm leading-6 text-muted-foreground shadow-sm shadow-black/5 dark:border-white/10 dark:bg-white/6">
        No issues match this view. The current audit rules did not find anything here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {issues.map((issue, index) => (
        <IssueCard
          key={issue.code}
          issue={issue}
          index={index}
          recommendation={aiRecommendationMap.get(issue.code)}
          expanded={expandedIssueCode === issue.code}
          onToggle={() =>
            setExpandedIssueCode(expandedIssueCode === issue.code ? null : issue.code)
          }
        />
      ))}
    </div>
  );
}

function IssueCard({
  issue,
  index,
  recommendation,
  expanded,
  onToggle,
}: {
  issue: AuditIssue;
  index: number;
  recommendation?: EnrichedAuditResponse["aiInsights"]["issueRecommendations"][number];
  expanded: boolean;
  onToggle: () => void;
}) {
  const styles = severityStyles[issue.severity];

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.025 * index, duration: 0.25 }}
      className={cn(
        "group relative overflow-hidden rounded-[28px] border border-white/60 bg-white/62 shadow-sm shadow-black/5 transition duration-300 hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/6",
        styles.shadow,
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-px bg-gradient-to-r", styles.line)} />
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-5 text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("h-2.5 w-2.5 rounded-full", styles.dot)} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {issue.category.replace("-", " ")}
              </span>
              <span
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
                  styles.badge,
                )}
              >
                {issue.severity}
              </span>
            </div>
            <h4 className="font-display text-lg font-bold leading-tight text-foreground sm:text-xl">
              {issue.title}
            </h4>
            <p className="text-sm leading-6 text-muted-foreground">
              {issue.description}
            </p>
          </div>
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/70 shadow-sm shadow-black/5 dark:border-white/10 dark:bg-white/8"
          >
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="grid gap-3 border-t border-white/55 p-5 pt-0 dark:border-white/10 sm:grid-cols-2">
              <InsightBlock label="Impact" value={`${issue.impact}/100 priority weight`} />
              <InsightBlock label="Fix Recommendation" value={issue.recommendation} />
              {recommendation ? (
                <>
                  <InsightBlock label="Why it matters" value={recommendation.whyItMatters} />
                  <InsightBlock label="SEO impact" value={recommendation.seoImpact} />
                  <InsightBlock label="Actionable fix" value={recommendation.actionableFix} />
                  <InsightBlock label="Example" value={recommendation.exampleImprovement} />
                </>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}

function FixesByPriorityPanel({
  groups,
  onViewFix,
}: {
  groups: Array<{ severity: AuditIssueSeverity; issues: AuditIssue[] }>;
  onViewFix: (issue: AuditIssue) => void;
}) {
  return (
    <Card className="rounded-[30px]">
      <CardContent className="space-y-5 p-5 md:p-6">
        <SectionHeading
          icon={Target}
          title="Fixes by Priority"
          description="A practical work queue ordered by severity and expected audit impact."
        />
        <div className="space-y-4">
          {groups.map(({ severity, issues }) => (
            <div key={severity} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4
                  className={cn(
                    "text-sm font-bold uppercase tracking-[0.18em]",
                    severityStyles[severity].accent,
                  )}
                >
                  {severityStyles[severity].label}
                </h4>
                <span className="text-xs text-muted-foreground">
                  {issues.length} fix{issues.length === 1 ? "" : "es"}
                </span>
              </div>
              {issues.length === 0 ? (
                <div className="rounded-[22px] border border-white/60 bg-white/55 p-4 text-sm text-muted-foreground dark:border-white/10 dark:bg-white/6">
                  No {severity} priority fixes in this audit.
                </div>
              ) : (
                issues.map((issue) => (
                  <div
                    key={issue.code}
                    className="flex flex-col gap-3 rounded-[24px] border border-white/60 bg-white/55 p-4 shadow-sm shadow-black/5 dark:border-white/10 dark:bg-white/6 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full", severityStyles[issue.severity].dot)} />
                        <p className="font-semibold text-foreground">{issue.title}</p>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {issue.recommendation}
                      </p>
                      <p className="text-xs font-medium text-muted-foreground">
                        Estimated impact: {issue.impact}/100
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onViewFix(issue)}
                      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-slate-950/10 bg-slate-950 px-4 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-slate-800 dark:border-white/10 dark:bg-white dark:text-slate-950"
                    >
                      View Fix
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AiInsightsPanel({
  report,
  allIssues,
  onViewFix,
}: {
  report: EnrichedAuditResponse;
  allIssues: AuditIssue[];
  onViewFix: (issue: AuditIssue) => void;
}) {
  const quickWins = allIssues
    .filter((issue) => issue.severity !== "high")
    .slice(0, 3);
  const highImpact = allIssues
    .filter((issue) => issue.severity === "high" || issue.impact >= 12)
    .slice(0, 3);
  const aiTips = report.aiVisibilityIssues.slice(0, 3);

  return (
    <Card className="relative overflow-hidden rounded-[30px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(59,130,246,0.12),transparent_36%),radial-gradient(circle_at_90%_20%,rgba(245,158,11,0.12),transparent_28%)]" />
      <CardContent className="relative space-y-5 p-5 md:p-6">
        <SectionHeading
          icon={Sparkles}
          title="AI SEO Insights"
          description={
            report.aiInsights.generated
              ? `Generated with ${report.aiInsights.provider} ${report.aiInsights.model ?? ""}`.trim()
              : "Fallback guidance from the built-in EFFIX audit intelligence."
          }
        />
        <div className="rounded-[26px] border border-white/60 bg-white/65 p-5 shadow-sm shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/8">
          <p className="text-sm leading-7 text-muted-foreground">
            {report.aiInsights.summary}
          </p>
          {!report.aiInsights.generated && report.aiInsights.fallbackReason ? (
            <p className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-5 text-amber-700 dark:text-amber-200">
              Fallback reason: {report.aiInsights.fallbackReason}
            </p>
          ) : null}
        </div>
        <AiActionGroup title="Quick Wins" issues={quickWins} onViewFix={onViewFix} />
        <AiActionGroup
          title="High Impact Opportunities"
          issues={highImpact}
          onViewFix={onViewFix}
        />
        <AiActionGroup
          title="AI Visibility Tips"
          issues={aiTips}
          onViewFix={onViewFix}
          empty="No AI visibility issues were detected."
        />
      </CardContent>
    </Card>
  );
}

function AiActionGroup({
  title,
  issues,
  onViewFix,
  empty = "No matching opportunities in this audit.",
}: {
  title: string;
  issues: AuditIssue[];
  onViewFix: (issue: AuditIssue) => void;
  empty?: string;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </h4>
      {issues.length === 0 ? (
        <p className="rounded-2xl border border-white/60 bg-white/55 p-3 text-sm text-muted-foreground dark:border-white/10 dark:bg-white/6">
          {empty}
        </p>
      ) : (
        issues.map((issue) => (
          <button
            key={issue.code}
            type="button"
            onClick={() => onViewFix(issue)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/55 p-3 text-left transition duration-300 hover:-translate-y-0.5 hover:bg-white/75 dark:border-white/10 dark:bg-white/6 dark:hover:bg-white/10"
          >
            <span className="min-w-0 text-sm font-medium text-foreground">
              {issue.recommendation}
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        ))
      )}
    </div>
  );
}

function PageSignalsCard({ report }: { report: EnrichedAuditResponse }) {
  return (
    <Card className="rounded-[30px]">
      <CardContent className="space-y-5 p-5 md:p-6">
        <SectionHeading
          icon={BarChart3}
          title="Page Signals"
          description="Cleanly parsed on-page metrics from the current audit run."
        />
        <MetricGrid
          metrics={[
            ["Title", `${report.metadata.title.length || 0} chars`],
            ["Description", `${report.metadata.metaDescription.length || 0} chars`],
            ["Headings", `${report.metadata.h1s.length} H1 / ${report.metadata.h2s.length} H2`],
            ["Links", `${report.metadata.internalLinkCount} internal / ${report.metadata.externalLinkCount} external`],
            ["Images", `${report.metadata.missingImageAltCount} missing alt`],
            ["Words", report.metadata.wordCount.toLocaleString()],
          ]}
        />
      </CardContent>
    </Card>
  );
}

function CategoryHealthCard({
  icon: Icon,
  title,
  description,
  score,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  score: number;
}) {
  return (
    <Card className="rounded-[30px]">
      <CardContent className="space-y-6 p-6">
        <SectionHeading icon={Icon} title={title} description={description} />
        <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
          <ScoreRing score={score} size={132} strokeWidth={10} label="Score" />
          <div className="space-y-4">
            <ProgressSignal
              label="Current readiness"
              value={score}
              detail={`${getScoreLabel(score)} based on active audit rules`}
            />
            <MiniChart values={buildTrend(score)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/60 bg-white/70 text-blue-600 shadow-sm shadow-black/5 dark:border-white/10 dark:bg-white/8 dark:text-blue-300">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h3 className="font-display text-xl font-bold tracking-tight">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function SeverityFilterBar({
  value,
  onChange,
  issues,
}: {
  value: SeverityFilter;
  onChange: (value: SeverityFilter) => void;
  issues: AuditIssue[];
}) {
  const filters: SeverityFilter[] = ["all", ...severities];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const active = value === filter;
        const count =
          filter === "all"
            ? issues.length
            : issues.filter((issue) => issue.severity === filter).length;

        return (
          <button
            key={filter}
            type="button"
            onClick={() => onChange(filter)}
            className={cn(
              "rounded-full border px-3 py-2 text-xs font-semibold capitalize transition duration-300",
              active
                ? "border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-950/10 dark:border-white dark:bg-white dark:text-slate-950"
                : "border-white/60 bg-white/55 text-muted-foreground hover:-translate-y-0.5 hover:text-foreground dark:border-white/10 dark:bg-white/6",
            )}
          >
            {filter} <span className="opacity-70">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

function InsightBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/60 bg-white/55 p-4 dark:border-white/10 dark:bg-white/6">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{value}</p>
    </div>
  );
}

function MetricGrid({ metrics }: { metrics: Array<[string, string]> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {metrics.map(([label, value]) => (
        <div
          key={label}
          className="rounded-[22px] border border-white/60 bg-white/55 p-4 shadow-sm shadow-black/5 dark:border-white/10 dark:bg-white/6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 break-words font-display text-2xl font-bold">{value}</p>
        </div>
      ))}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[22px] border border-white/60 bg-white/55 p-4 text-center shadow-sm shadow-black/5 dark:border-white/10 dark:bg-white/6">
      <p className="font-display text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function ProgressSignal({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  const normalized = Math.max(0, Math.min(100, value));

  return (
    <div className="rounded-[22px] border border-white/60 bg-white/55 p-4 shadow-sm shadow-black/5 dark:border-white/10 dark:bg-white/6">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-foreground">{label}</p>
          <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
        </div>
        <p className="font-display text-2xl font-bold">{normalized}</p>
      </div>
      <div className="h-2 rounded-full bg-slate-950/8 dark:bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${normalized}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-amber-400"
        />
      </div>
    </div>
  );
}

function AnalyticsStrip({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map(([label, value]) => (
        <div
          key={label}
          className="rounded-[22px] border border-white/60 bg-white/55 p-4 dark:border-white/10 dark:bg-white/6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 break-words text-sm font-semibold text-foreground">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

function RecommendationsList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </h4>
      {items.map((item) => (
        <div
          key={item}
          className="flex gap-3 rounded-[22px] border border-white/60 bg-white/55 p-4 text-sm leading-6 text-muted-foreground dark:border-white/10 dark:bg-white/6"
        >
          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          {item}
        </div>
      ))}
    </div>
  );
}

function CompactIssue({ issue }: { issue: AuditIssue }) {
  return (
    <div className="rounded-[22px] border border-white/60 bg-white/55 p-4 shadow-sm shadow-black/5 dark:border-white/10 dark:bg-white/6">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-foreground">{issue.title}</p>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
            severityStyles[issue.severity].badge,
          )}
        >
          {issue.severity}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {issue.recommendation}
      </p>
    </div>
  );
}

function MiniChart({ values }: { values: number[] }) {
  return (
    <div className="flex h-16 items-end gap-1.5 rounded-[20px] border border-white/60 bg-white/45 p-3 dark:border-white/10 dark:bg-white/5">
      {values.map((value, index) => (
        <motion.div
          key={`${value}-${index}`}
          initial={{ height: 0 }}
          animate={{ height: `${value}%` }}
          transition={{ delay: index * 0.035, duration: 0.45, ease: "easeOut" }}
          className="flex-1 rounded-t-full bg-gradient-to-t from-blue-500/45 via-violet-500/55 to-amber-300/80"
        />
      ))}
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-semibold",
        score <= 49
          ? severityStyles.high.badge
          : score <= 79
            ? severityStyles.medium.badge
            : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-300/20 dark:text-emerald-200",
      )}
    >
      {getScoreLabel(score)}
    </span>
  );
}

function getScoreLabel(score: number) {
  if (score <= 49) {
    return "Needs Focus";
  }

  if (score <= 79) {
    return "Improving";
  }

  return "Strong";
}

function buildTrend(score: number) {
  const base = Math.max(18, Math.min(92, score));
  return [base - 18, base - 9, base - 14, base - 4, base - 8, base, base + 4].map(
    (value) => Math.max(12, Math.min(100, value)),
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
    return "AI Visibility";
  }

  if (label === "GEO Optimization") {
    return "GEO";
  }

  if (label === "Links & Authority") {
    return "Links";
  }

  return label;
}
