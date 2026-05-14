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
  ClipboardList,
  Download,
  ExternalLink,
  FileText,
  Gauge,
  Globe2,
  Link2,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

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
type SidebarNavId = DashboardTabId | "recommendations" | "issues" | "export";
type MainViewId = Exclude<SidebarNavId, "export">;
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
    accent: "text-rose-600",
    badge:
      "border-rose-500/20 bg-rose-500/10 text-rose-700",
    line: "from-rose-400/70 via-rose-400/20 to-transparent",
    dot: "bg-rose-500",
    shadow: "hover:shadow-[0_24px_80px_rgba(244,63,94,0.14)]",
  },
  medium: {
    label: "Medium Priority",
    accent: "text-amber-600",
    badge:
      "border-amber-500/20 bg-amber-500/10 text-amber-700",
    line: "from-amber-400/80 via-amber-400/20 to-transparent",
    dot: "bg-amber-500",
    shadow: "hover:shadow-[0_24px_80px_rgba(245,158,11,0.14)]",
  },
  low: {
    label: "Low Priority",
    accent: "text-sky-600",
    badge:
      "border-sky-500/20 bg-sky-500/10 text-sky-700",
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
  const [activeView, setActiveView] = useState<MainViewId>("overview");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [expandedIssueCode, setExpandedIssueCode] = useState<string | null>(
    report.technicalIssues[0]?.code ??
      report.contentIssues[0]?.code ??
      report.aiVisibilityIssues[0]?.code ??
      null,
  );
  const issuesRef = useRef<HTMLDivElement>(null);
  const mainViewportRef = useRef<HTMLDivElement>(null);
  const activeViewRef = useRef<MainViewId>("overview");
  const savedScrollByView = useRef<Partial<Record<MainViewId, number>>>({});

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
    const category =
      activeView === "recommendations" || activeView === "issues"
        ? undefined
        : tabCategoryMap[activeView];
    const source = category
      ? allIssues.filter((issue) => issue.category === category)
      : activeView === "links"
        ? allIssues.filter(
            (issue) =>
              issue.code.includes("link") ||
              issue.code.includes("canonical") ||
              issue.category === "ai-visibility",
          )
        : activeView === "performance"
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
  }, [activeView, allIssues, severityFilter]);

  const fixesBySeverity = useMemo(
    () =>
      severities.map((severity) => ({
        severity,
        issues: allIssues.filter((issue) => issue.severity === severity),
      })),
    [allIssues],
  );

  function saveCurrentScroll() {
    savedScrollByView.current[activeViewRef.current] =
      mainViewportRef.current?.scrollTop ?? 0;
  }

  function switchView(target: MainViewId, restoreScroll = true) {
    saveCurrentScroll();
    if (!restoreScroll) {
      savedScrollByView.current[target] = 0;
    }
    setActiveView(target);
  }

  function focusIssue(issue: AuditIssue) {
    switchView(issue.category, false);
    setSeverityFilter(issue.severity);
    setExpandedIssueCode(issue.code);
    window.setTimeout(() => {
      issuesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  function navigateSidebar(target: SidebarNavId) {
    if (target === "export") {
      window.print();
      return;
    }

    switchView(target);
  }

  useEffect(() => {
    activeViewRef.current = activeView;
    const scrollTop = savedScrollByView.current[activeView] ?? 0;
    const frame = window.requestAnimationFrame(() => {
      mainViewportRef.current?.scrollTo({ top: scrollTop, behavior: "auto" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeView]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative h-screen w-full overflow-hidden"
    >
      <div className="h-screen overflow-hidden border-slate-200/80 bg-[#f7f8fc]">
        <div className="grid h-screen grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[248px_minmax(0,1fr)] lg:grid-rows-1">
          <DashboardSidebar
            activeNav={activeView}
            onNavigate={navigateSidebar}
            report={report}
          />

          <div
            ref={mainViewportRef}
            className="min-w-0 overflow-y-auto border-l border-slate-200/80 bg-[#f8f9fd] scroll-smooth"
          >
            <DashboardTopHeader report={report} />

            <main className="px-4 pb-6 sm:px-6 lg:px-8">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeView}
                  initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
                  transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                >
                  {activeView === "overview" ? (
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
                      issueCounts={issueCounts}
                    />
                  ) : activeView === "performance" ? (
                    <PerformancePanel report={report} issues={activeIssues} />
                  ) : activeView === "geo" ? (
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
                  ) : activeView === "links" ? (
                    <LinksPanel report={report} issues={activeIssues} />
                  ) : activeView === "recommendations" ? (
                    <RecommendationsPanel
                      report={report}
                      allIssues={allIssues}
                      fixesBySeverity={fixesBySeverity}
                      focusIssue={focusIssue}
                    />
                  ) : activeView === "issues" ? (
                    <AllIssuesPanel
                      issues={activeIssues}
                      allIssues={allIssues}
                      aiRecommendationMap={aiRecommendationMap}
                      expandedIssueCode={expandedIssueCode}
                      setExpandedIssueCode={setExpandedIssueCode}
                      severityFilter={severityFilter}
                      setSeverityFilter={setSeverityFilter}
                      issuesRef={issuesRef}
                    />
                  ) : (
                    <AuditCategoryPanel
                      tabId={activeView}
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
            </main>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function DashboardSidebar({
  activeNav,
  onNavigate,
  report,
}: {
  activeNav: SidebarNavId;
  onNavigate: (target: SidebarNavId) => void;
  report: EnrichedAuditResponse;
}) {
  return (
    <aside className="z-20 max-h-[44vh] overflow-y-auto border-b border-slate-200 bg-white px-4 py-5 lg:sticky lg:top-0 lg:h-screen lg:max-h-none lg:border-b-0 lg:py-6">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 rotate-45 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#3f37ff] to-[#7657ff] shadow-lg shadow-indigo-500/20">
          <div className="h-3.5 w-3.5 rounded-[4px] border-2 border-white" />
        </div>
        <span className="font-display text-2xl font-bold tracking-[0.16em] text-[#101936]">
          EFFIX
        </span>
      </div>

      <SidebarSection title="Main">
        <SidebarItem
          tab={{ id: "overview", label: "Overview", icon: Search }}
          active={activeNav === "overview"}
          onClick={() => onNavigate("overview")}
        />
      </SidebarSection>

      <SidebarSection title="Audit">
        {dashboardTabs.slice(1).map((tab) => (
          <SidebarItem
            key={tab.id}
            tab={tab}
            active={activeNav === tab.id}
            onClick={() => onNavigate(tab.id)}
          />
        ))}
      </SidebarSection>

      <SidebarSection title="Reports">
        <SidebarItem
          tab={{ id: "recommendations", label: "Recommendations", icon: ClipboardList }}
          active={activeNav === "recommendations"}
          onClick={() => onNavigate("recommendations")}
        />
        <SidebarItem
          tab={{ id: "issues", label: "Issues", icon: AlertTriangle }}
          active={activeNav === "issues"}
          onClick={() => onNavigate("issues")}
        />
        <SidebarItem
          tab={{ id: "export", label: "Export Report", icon: Download }}
          active={activeNav === "export"}
          onClick={() => onNavigate("export")}
        />
      </SidebarSection>

      <div className="mt-8 rounded-[18px] border border-indigo-100 bg-gradient-to-b from-white to-indigo-50/70 p-5 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
          Audit Host
        </p>
        <p className="mt-2 truncate font-display text-lg font-bold text-[#101936]">
          {report.metadata.hostname}
        </p>
        <div className="mt-4 h-1.5 rounded-full bg-indigo-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${report.score}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-[#4437ff] to-[#7c5cff]"
          />
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          {report.score >= 80 ? "Strong audit posture" : "Optimization plan ready"}
        </p>
      </div>

      <div className="mt-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white">
          N
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#101936]">Nagarjun</p>
          <p className="truncate text-xs text-slate-500">{report.metadata.hostname}</p>
        </div>
      </div>
    </aside>
  );
}

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-7">
      <p className="mb-3 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
        {title}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function SidebarItem({
  tab,
  active,
  onClick,
}: {
  tab: { id: SidebarNavId; label: string; icon: LucideIcon };
  active: boolean;
  onClick: () => void;
}) {
  const Icon = tab.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex h-11 w-full items-center gap-3 rounded-[12px] px-3 text-sm font-semibold transition duration-300",
        active
          ? "bg-indigo-50 text-[#332bff]"
          : "text-slate-700 hover:bg-slate-50 hover:text-[#332bff]",
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{tab.label}</span>
      {active ? (
        <motion.span
          layoutId="sidebar-active-rail"
          className="absolute right-0 top-2 h-7 w-0.5 rounded-full bg-[#4437ff]"
        />
      ) : null}
    </button>
  );
}

function DashboardTopHeader({ report }: { report: EnrichedAuditResponse }) {
  function shareReport() {
    const shareData = {
      title: "EFFIX SEO Audit Results",
      text: `SEO audit results for ${report.metadata.hostname}`,
      url: window.location.href,
    };

    if (navigator.share) {
      void navigator.share(shareData);
      return;
    }

    void navigator.clipboard?.writeText(window.location.href);
  }

  function exportReport() {
    window.print();
  }

  return (
    <header className="flex flex-col gap-4 px-4 py-7 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-2xl font-bold tracking-tight text-[#101936] sm:text-3xl">
            SEO Audit Results
          </h2>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
            Completed
          </span>
        </div>
        <p className="mt-2 text-base text-[#294066]">
          Your comprehensive SEO & AI visibility analysis
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <HeaderAction icon={Share2} label="Share" onClick={shareReport} />
        <HeaderAction icon={Download} label="Export PDF" onClick={exportReport} />
      </div>
    </header>
  );
}

function HeaderAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white px-5 text-sm font-semibold text-[#101936] shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:text-[#4437ff] active:translate-y-0"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
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
    <Card className="relative overflow-hidden rounded-[18px] border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(83,72,255,0.10),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(247,249,255,0.92))]" />
      <div className="pointer-events-none absolute left-1/3 top-10 h-40 w-96 -rotate-6 rounded-full bg-gradient-to-r from-transparent via-indigo-200/30 to-transparent blur-xl" />
      <CardContent className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_240px_300px] lg:items-center">
        <div className="min-w-0 space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-[#294066]">
              Analyzed URL
            </p>
            <div className="flex items-center gap-3">
              <h2 className="break-all font-display text-2xl font-bold tracking-tight text-[#101936] sm:text-3xl">
                {report.metadata.url}
              </h2>
              <ExternalLink className="h-5 w-5 shrink-0 text-[#4437ff]" />
            </div>
            <p className="flex flex-wrap items-center gap-3 text-sm text-[#294066]">
              Audited on {new Date(report.metadata.fetchedAt).toLocaleString()}
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                Completed
              </span>
            </p>
          </div>

          <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
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

        <div className="flex flex-col items-center justify-center gap-3 border-slate-200 lg:border-r lg:pr-8">
          <ScoreRing
            score={report.score}
            size={164}
            strokeWidth={12}
            label="Overall"
            className="border-0 bg-transparent shadow-none"
          />
          <p className="text-center text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            {scoreLabel} audit posture
          </p>
        </div>

        <div className="space-y-5">
          <p className="text-base leading-7 text-[#101936]">
            Your website is performing well, but there are opportunities to
            improve visibility and rankings.
          </p>
          <button
            type="button"
            onClick={() =>
              document
                .getElementById("issues-section")
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            className="inline-flex h-11 items-center gap-2 rounded-[12px] border border-indigo-200 bg-indigo-50 px-5 text-sm font-semibold text-[#4437ff] transition duration-300 hover:-translate-y-0.5 hover:bg-indigo-100"
          >
            View Priorities
            <ArrowRight className="h-4 w-4" />
          </button>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {severities.map((severity) => (
              <div
                key={severity}
                className="rounded-[12px] border border-slate-200 bg-white/80 p-3 text-center"
              >
                <p
                  className={cn(
                    "font-display text-lg font-bold",
                    severityStyles[severity].accent,
                  )}
                >
                  {issueCounts[severity]}
                </p>
                <p className="text-[10px] font-semibold capitalize text-slate-500">
                  {severity}
                </p>
              </div>
            ))}
          </div>
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
    blue: "from-[#4437ff] to-[#7c5cff]",
    emerald: "from-emerald-500 to-teal-400",
    amber: "from-orange-400 to-amber-300",
  };

  return (
    <div className="rounded-[14px] border border-slate-200 bg-white/80 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-0.5 hover:border-indigo-200">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          {label}
        </p>
        <TrendingUp className="h-4 w-4 text-slate-400" />
      </div>
      <p className="font-display text-2xl font-bold text-[#101936]">
        {value}
        <span className="text-sm text-[#294066]">{suffix}</span>
      </p>
      <div className="mt-3 h-1.5 rounded-full bg-slate-100">
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

function MinimalMetricBlocks({ report }: { report: EnrichedAuditResponse }) {
  const metrics = scoreCards.map(({ key, label, icon, insight }) => ({
    label,
    icon,
    insight,
    score: report.scoreBreakdown[key],
    tone: key === "aiVisibility" ? "orange" : "violet",
  }));

  return (
    <Card className="overflow-hidden rounded-[18px] border-slate-200 bg-white shadow-[0_14px_44px_rgba(15,23,42,0.05)]">
      <div className="grid divide-y divide-slate-200 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
        {metrics.map(({ label, icon: Icon, insight, score, tone }, index) => {
          const status = getScoreLabel(score);

          return (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.28 }}
              className="group relative p-6 transition duration-300 hover:bg-indigo-50/30"
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                    tone === "orange"
                      ? "bg-orange-50 text-orange-500"
                      : "bg-indigo-50 text-[#5b45ff]",
                  )}
                >
                  <Icon className="h-5 w-5 transition duration-300 group-hover:scale-110" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-bold text-[#101936]">
                        {label}
                      </p>
                      <p className="mt-2 font-display text-4xl font-bold tracking-tight text-[#101936]">
                        {score}
                        <span className="ml-1 text-base font-medium text-[#294066]">
                          /100
                        </span>
                      </p>
                    </div>
                    <ScoreBadge score={score} />
                  </div>

                  <div className="mt-5 h-1.5 rounded-full bg-slate-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      title={`${label}: ${score}/100 (${status})`}
                      className={cn(
                        "h-full rounded-full shadow-[0_4px_12px_rgba(68,55,255,0.16)]",
                        tone === "orange"
                          ? "bg-gradient-to-r from-orange-400 to-amber-300"
                          : "bg-gradient-to-r from-[#4437ff] to-[#7c5cff]",
                      )}
                    />
                  </div>

                  <p className="mt-4 text-sm leading-6 text-[#64708f]">{insight}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
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
  issueCounts,
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
  issuesRef: RefObject<HTMLDivElement | null>;
  issueCounts: Record<AuditIssueSeverity, number>;
}) {
  return (
    <div id="overview-section" className="space-y-5 scroll-mt-24">
      <ResultsHero report={report} issueCounts={issueCounts} />
      <MinimalMetricBlocks report={report} />

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <PriorityIssuesPanel
            sectionId="issues-section"
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
          <FixesByPriorityPanel
            sectionId="fixes-section"
            groups={fixesBySeverity}
            onViewFix={focusIssue}
          />
        </div>

        <div className="space-y-6">
          <AiInsightsPanel
            sectionId="recommendations-section"
            report={report}
            allIssues={allIssues}
            onViewFix={focusIssue}
          />
          <PageSignalsCard report={report} />
          <ScoreHistoryCard score={report.score} />
        </div>
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
  issuesRef: RefObject<HTMLDivElement | null>;
}) {
  const config = getMajorSectionConfig(tabId, report);
  const categoryIssues =
    tabId === "technical"
      ? report.technicalIssues
      : tabId === "content"
        ? report.contentIssues
        : report.aiVisibilityIssues;

  return (
    <div id={`${tabId}-section`} className="space-y-6 scroll-mt-24">
      <SectionControlPanel config={config} />

      <div className="grid gap-4 lg:grid-cols-4">
        {config.metrics.map((metric) => (
          <MetricTile key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-[16px] border-slate-200 bg-white">
          <CardContent className="space-y-5 p-5">
            <SectionHeading
              icon={BarChart3}
              title={config.analyticsTitle}
              description={config.analyticsDescription}
            />
            <div className="space-y-3">
              {config.readiness.map((signal) => (
                <ProgressSignal key={signal.label} {...signal} />
              ))}
            </div>
          </CardContent>
        </Card>

        <PriorityIssuesPanel
          sectionId="issues-section"
          title={`${config.title} Issue Table`}
          description={config.issueDescription}
          issues={issues}
          allIssues={categoryIssues}
          aiRecommendationMap={aiRecommendationMap}
          expandedIssueCode={expandedIssueCode}
          setExpandedIssueCode={setExpandedIssueCode}
          severityFilter={severityFilter}
          setSeverityFilter={setSeverityFilter}
          issuesRef={issuesRef}
        />
      </div>

      <RecommendationsList title={config.recommendationTitle} items={config.recommendations} />
    </div>
  );
}

type MajorSectionConfig = {
  icon: LucideIcon;
  title: string;
  description: string;
  score: number;
  metrics: Array<{
    label: string;
    value: string;
    detail: string;
    score: number;
  }>;
  readiness: Array<{
    label: string;
    value: number;
    detail: string;
  }>;
  analyticsTitle: string;
  analyticsDescription: string;
  issueDescription: string;
  recommendationTitle: string;
  recommendations: string[];
};

function getMajorSectionConfig(
  tabId: Exclude<DashboardTabId, "overview" | "performance" | "geo" | "links">,
  report: EnrichedAuditResponse,
): MajorSectionConfig {
  const titleLength = report.metadata.title.length;
  const descriptionLength = report.metadata.metaDescription.length;
  const hasCanonical = Boolean(report.metadata.canonicalUrl);
  const hasViewport = Boolean(report.metadata.viewport);
  const isHttps = report.metadata.url.startsWith("https://");
  const h1Count = report.metadata.h1s.length;
  const h2Count = report.metadata.h2s.length;
  const wordCount = report.metadata.wordCount;
  const faqCount = report.metadata.faqHeadings.length;
  const internalLinks = report.metadata.internalLinkCount;
  const externalLinks = report.metadata.externalLinkCount;

  const titleScore = titleLength >= 30 && titleLength <= 65 ? 94 : titleLength > 0 ? 64 : 28;
  const metaScore =
    descriptionLength >= 120 && descriptionLength <= 170
      ? 92
      : descriptionLength > 0
        ? 66
        : 30;
  const headingScore = h1Count === 1 && h2Count >= 2 ? 92 : h1Count > 0 ? 68 : 35;
  const readabilityScore = Math.max(34, 92 - report.metadata.longParagraphCount * 14);
  const depthScore = wordCount >= 900 ? 92 : wordCount >= 450 ? 74 : wordCount >= 250 ? 58 : 34;
  const semanticScore = Math.min(96, 42 + h2Count * 8 + internalLinks * 5 + faqCount * 9);
  const faqScore = faqCount > 2 ? 95 : faqCount > 0 ? 78 : 40;
  const answerScore = Math.min(96, 38 + faqCount * 14 + Math.floor(wordCount / 55));
  const entityScore = Math.min(94, 44 + h1Count * 12 + h2Count * 6 + externalLinks * 5);
  const discoverabilityScore = Math.min(96, 45 + internalLinks * 8 + externalLinks * 6 + (hasCanonical ? 8 : 0));

  if (tabId === "technical") {
    return {
      icon: Wrench,
      title: "Technical SEO",
      description:
        "Crawlability, indexing signals, Core Web Vitals readiness, HTTPS, canonical hygiene, and technical fix tracking.",
      score: report.scoreBreakdown.technical,
      metrics: [
        {
          label: "Crawlability",
          value: `HTTP ${report.metadata.statusCode}`,
          detail: report.metadata.statusCode < 400 ? "Fetchable response" : "Response needs review",
          score: report.metadata.statusCode < 400 ? 94 : 42,
        },
        {
          label: "Robots.txt",
          value: "Verify",
          detail: "Requires sitewide crawl scope",
          score: 62,
        },
        {
          label: "Sitemap",
          value: "Verify",
          detail: "Requires XML sitemap discovery",
          score: 60,
        },
        {
          label: "Canonical Tags",
          value: hasCanonical ? "Present" : "Missing",
          detail: hasCanonical ? "Canonical signal detected" : "No canonical URL found",
          score: hasCanonical ? 94 : 38,
        },
      ],
      readiness: [
        {
          label: "Indexing Readiness",
          value: Math.min(98, (hasCanonical ? 32 : 0) + (hasViewport ? 22 : 0) + (isHttps ? 24 : 0) + (report.metadata.statusCode < 400 ? 20 : 0)),
          detail: "Canonical, HTTPS, mobile viewport, and response status blend",
        },
        {
          label: "Core Web Vitals Readiness",
          value: hasViewport ? 72 : 44,
          detail: hasViewport ? "Mobile viewport is in place; field data not included in page crawl" : "Viewport missing before field-data validation",
        },
        {
          label: "HTTPS Coverage",
          value: isHttps ? 98 : 35,
          detail: isHttps ? "Secure URL audited" : "Audit target did not use HTTPS",
        },
        {
          label: "Technical Issue Load",
          value: Math.max(20, 100 - report.technicalIssues.length * 18),
          detail: `${report.technicalIssues.length} tracked technical issue${report.technicalIssues.length === 1 ? "" : "s"}`,
        },
      ],
      analyticsTitle: "Technical Readiness Analytics",
      analyticsDescription:
        "Production crawl signals combined into a compact technical operations view.",
      issueDescription:
        "Track crawl, indexing, canonical, mobile, HTTPS, and technical readiness fixes.",
      recommendationTitle: "Technical Recommendations",
      recommendations: [
        hasCanonical
          ? "Keep canonical URLs consistent across variants, pagination, and campaign URLs."
          : "Add a self-referencing canonical tag to clarify the preferred indexable URL.",
        hasViewport
          ? "Validate Core Web Vitals with field data after the technical crawl is clean."
          : "Add a responsive viewport tag before evaluating mobile experience quality.",
        "Extend the crawl to robots.txt and XML sitemap discovery for full indexation governance.",
      ],
    };
  }

  if (tabId === "content") {
    return {
      icon: FileText,
      title: "Content Quality",
      description:
        "Title analysis, heading structure, readability, keyword depth, metadata, semantic coverage, and content opportunities.",
      score: report.scoreBreakdown.content,
      metrics: [
        {
          label: "Title Analysis",
          value: titleLength ? `${titleLength} chars` : "Missing",
          detail: "Recommended range is roughly 30-65 characters",
          score: titleScore,
        },
        {
          label: "Heading Structure",
          value: `${h1Count} H1 / ${h2Count} H2`,
          detail: h1Count === 1 ? "Primary heading present" : "Heading hierarchy needs review",
          score: headingScore,
        },
        {
          label: "Readability",
          value: `${report.metadata.longParagraphCount} long blocks`,
          detail: "Long paragraphs reduce scan quality",
          score: readabilityScore,
        },
        {
          label: "Meta Description",
          value: descriptionLength ? `${descriptionLength} chars` : "Missing",
          detail: "SERP summary and click-through signal",
          score: metaScore,
        },
      ],
      readiness: [
        {
          label: "Keyword Depth",
          value: depthScore,
          detail: `${wordCount.toLocaleString()} parsed words`,
        },
        {
          label: "Semantic Quality",
          value: semanticScore,
          detail: `${h2Count} secondary headings, ${internalLinks} internal links, ${faqCount} FAQ headings`,
        },
        {
          label: "Thin Content Risk",
          value: wordCount >= 450 ? 88 : wordCount >= 250 ? 62 : 34,
          detail: wordCount >= 450 ? "Substantive page depth detected" : "Expand the page with useful supporting sections",
        },
        {
          label: "Optimization Opportunity",
          value: Math.max(24, 100 - report.contentIssues.length * 17),
          detail: `${report.contentIssues.length} tracked content issue${report.contentIssues.length === 1 ? "" : "s"}`,
        },
      ],
      analyticsTitle: "Content Optimization Analytics",
      analyticsDescription:
        "Editorial, metadata, readability, and semantic signals organized as an optimization workspace.",
      issueDescription:
        "Prioritize title, headings, readability, thin content, metadata, and semantic quality fixes.",
      recommendationTitle: "Content Recommendations",
      recommendations: [
        titleScore >= 80
          ? "Preserve the current title length while tightening intent and differentiation."
          : "Rewrite the title to balance primary intent, clarity, and SERP-safe length.",
        headingScore >= 80
          ? "Use the current heading hierarchy to add deeper subtopics and comparison sections."
          : "Create one clear H1 and group supporting sections under descriptive H2 headings.",
        "Add specific examples, FAQs, proof points, and internal links where the page needs more topical depth.",
      ],
    };
  }

  return {
    icon: Bot,
    title: "AI Visibility",
    description:
      "Entity coverage, FAQ optimization, answer-engine readiness, GEO readiness, semantic relevance, and AI discoverability.",
    score: report.scoreBreakdown.aiVisibility,
    metrics: [
      {
        label: "Entity Coverage",
        value: `${h1Count + h2Count} headings`,
        detail: "Heading entities create extraction anchors",
        score: entityScore,
      },
      {
        label: "FAQ Optimization",
        value: `${faqCount} FAQ cues`,
        detail: "Question-led content improves answer eligibility",
        score: faqScore,
      },
      {
        label: "Answer Readiness",
        value: `${wordCount.toLocaleString()} words`,
        detail: "Concise, complete answers support answer engines",
        score: answerScore,
      },
      {
        label: "AI Discoverability",
        value: `${internalLinks + externalLinks} links`,
        detail: "Context links reinforce entity relationships",
        score: discoverabilityScore,
      },
    ],
    readiness: [
      {
        label: "AI Visibility Score",
        value: report.scoreBreakdown.aiVisibility,
        detail: "Weighted from FAQ, context links, headings, and content depth",
      },
      {
        label: "GEO Readiness",
        value: Math.min(96, Math.round((answerScore + faqScore + semanticScore) / 3)),
        detail: "Generative engine readiness based on answer structure and semantic support",
      },
      {
        label: "Semantic Relevance",
        value: semanticScore,
        detail: `${h2Count} H2 headings and ${internalLinks} internal context links`,
      },
      {
        label: "AI Issue Load",
        value: Math.max(20, 100 - report.aiVisibilityIssues.length * 18),
        detail: `${report.aiVisibilityIssues.length} tracked AI visibility issue${report.aiVisibilityIssues.length === 1 ? "" : "s"}`,
      },
    ],
    analyticsTitle: "AI Readiness Analytics",
    analyticsDescription:
      "Answer-engine signals organized for AI summaries, entity extraction, and generative search visibility.",
    issueDescription:
      "Track entity, FAQ, answer readiness, GEO, semantic relevance, and AI discoverability fixes.",
    recommendationTitle: "AI Visibility Recommendations",
    recommendations: [
      faqCount > 0
        ? "Expand FAQ answers with concise, source-like responses that can stand alone in AI summaries."
        : "Add question-led FAQ sections that answer the page's highest-intent search tasks directly.",
      "Use consistent entity names across headings, metadata, opening copy, and internal links.",
      "Add concise definition blocks, comparison language, and proof points for answer-engine extraction.",
    ],
  };
}

function SectionControlPanel({ config }: { config: MajorSectionConfig }) {
  const Icon = config.icon;

  return (
    <Card className="relative overflow-hidden rounded-[18px] border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(247,249,255,0.92))]" />
      <CardContent className="relative grid gap-7 p-6 sm:p-8 lg:grid-cols-[1fr_220px] lg:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-indigo-50 text-[#4437ff]">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Analytics Workspace
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#101936] sm:text-3xl">
                {config.title}
              </h2>
            </div>
          </div>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[#294066]">
            {config.description}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {config.metrics.slice(0, 3).map((metric) => (
              <div
                key={metric.label}
                className="rounded-[14px] border border-slate-200 bg-white/80 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {metric.label}
                </p>
                <p className="mt-2 font-display text-xl font-bold text-[#101936]">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center lg:justify-end">
          <ScoreRing
            score={config.score}
            size={154}
            strokeWidth={12}
            label="Score"
            className="border border-slate-100 shadow-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function MetricTile({
  label,
  value,
  detail,
  score,
}: {
  label: string;
  value: string;
  detail: string;
  score: number;
}) {
  return (
    <Card className="rounded-[16px] border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-0.5 hover:border-indigo-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-slate-500">
              {label}
            </p>
            <p className="mt-2 break-words font-display text-2xl font-bold text-[#101936]">
              {value}
            </p>
          </div>
          <ScoreBadge score={score} />
        </div>
        <p className="mt-3 text-sm leading-6 text-[#294066]">{detail}</p>
        <div className="mt-4 h-1.5 rounded-full bg-slate-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(100, score))}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-[#4437ff] to-[#21c48d]"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationsPanel({
  report,
  allIssues,
  fixesBySeverity,
  focusIssue,
}: {
  report: EnrichedAuditResponse;
  allIssues: AuditIssue[];
  fixesBySeverity: Array<{ severity: AuditIssueSeverity; issues: AuditIssue[] }>;
  focusIssue: (issue: AuditIssue) => void;
}) {
  return (
    <div id="recommendations-section" className="space-y-6 scroll-mt-24">
      <Card className="relative overflow-hidden rounded-[18px] border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(247,249,255,0.94))]" />
        <CardContent className="relative grid gap-7 p-6 sm:p-8 lg:grid-cols-[1fr_260px] lg:items-center">
          <div>
            <SectionHeading
              icon={ClipboardList}
              title="Recommendations"
              description="A prioritized SEO work queue built from the current audit, AI guidance, and expected issue impact."
            />
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <HeroStat
                label="Quick Wins"
                value={allIssues.filter((issue) => issue.severity !== "high").length}
                suffix=""
                tone="blue"
              />
              <HeroStat
                label="High Impact"
                value={allIssues.filter((issue) => issue.severity === "high" || issue.impact >= 12).length}
                suffix=""
                tone="amber"
              />
              <HeroStat
                label="AI Guided"
                value={report.aiInsights.issueRecommendations.length}
                suffix=""
                tone="emerald"
              />
            </div>
          </div>
          <ScoreRing
            score={report.score}
            size={154}
            strokeWidth={12}
            label="Plan"
            className="justify-self-center border border-slate-100 shadow-none lg:justify-self-end"
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <AiInsightsPanel
          report={report}
          allIssues={allIssues}
          onViewFix={focusIssue}
        />
        <FixesByPriorityPanel groups={fixesBySeverity} onViewFix={focusIssue} />
      </div>
    </div>
  );
}

function AllIssuesPanel({
  issues,
  allIssues,
  aiRecommendationMap,
  expandedIssueCode,
  setExpandedIssueCode,
  severityFilter,
  setSeverityFilter,
  issuesRef,
}: {
  issues: AuditIssue[];
  allIssues: AuditIssue[];
  aiRecommendationMap: Map<string, EnrichedAuditResponse["aiInsights"]["issueRecommendations"][number]>;
  expandedIssueCode: string | null;
  setExpandedIssueCode: (code: string | null) => void;
  severityFilter: SeverityFilter;
  setSeverityFilter: (severity: SeverityFilter) => void;
  issuesRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div id="issues-section" className="space-y-6 scroll-mt-24">
      <Card className="rounded-[18px] border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <SectionHeading
              icon={AlertTriangle}
              title="Issues"
              description="A complete issue register across technical SEO, content quality, and AI visibility."
            />
            <div className="grid min-w-0 gap-3 sm:grid-cols-3">
              {severities.map((severity) => (
                <div
                  key={severity}
                  className="rounded-[14px] border border-slate-200 bg-slate-50/70 px-5 py-4 text-center"
                >
                  <p className={cn("font-display text-2xl font-bold", severityStyles[severity].accent)}>
                    {allIssues.filter((issue) => issue.severity === severity).length}
                  </p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.13em] text-slate-500">
                    {severity}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <PriorityIssuesPanel
        title="Issue Table"
        description="Filter by severity, expand each row, and inspect the recommended fix without leaving the workspace."
        issues={issues}
        allIssues={allIssues}
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
    <div id="performance-section" className="grid scroll-mt-24 gap-6 lg:grid-cols-[1fr_0.9fr]">
      <Card className="rounded-[16px] border-slate-200 bg-white">
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
      <Card className="rounded-[16px] border-slate-200 bg-white">
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
  issuesRef: RefObject<HTMLDivElement | null>;
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
    <div id="geo-section" className="grid scroll-mt-24 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="rounded-[16px] border-slate-200 bg-white">
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
        sectionId="issues-section"
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
    <div id="links-section" className="grid scroll-mt-24 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="rounded-[16px] border-slate-200 bg-white">
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
      <Card className="rounded-[16px] border-slate-200 bg-white">
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
  sectionId,
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
  sectionId?: string;
  title: string;
  description: string;
  issues: AuditIssue[];
  allIssues: AuditIssue[];
  aiRecommendationMap: Map<string, EnrichedAuditResponse["aiInsights"]["issueRecommendations"][number]>;
  expandedIssueCode: string | null;
  setExpandedIssueCode: (code: string | null) => void;
  severityFilter: SeverityFilter;
  setSeverityFilter: (severity: SeverityFilter) => void;
  issuesRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <Card className="rounded-[16px] border-slate-200 bg-white">
      <div id={sectionId} ref={issuesRef} className="scroll-mt-24">
        <CardContent className="space-y-5 p-5">
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
      <div className="rounded-[14px] border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-[#294066] shadow-sm">
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
        "group relative overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-[#fcfcff]",
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
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
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
            <h4 className="font-display text-base font-bold leading-tight text-[#101936] sm:text-lg">
              {issue.title}
            </h4>
            <p className="text-sm leading-6 text-[#294066]">
              {issue.description}
            </p>
          </div>
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm"
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
            <div className="grid gap-3 border-t border-slate-100 p-5 pt-0 sm:grid-cols-2">
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
  sectionId,
  groups,
  onViewFix,
}: {
  sectionId?: string;
  groups: Array<{ severity: AuditIssueSeverity; issues: AuditIssue[] }>;
  onViewFix: (issue: AuditIssue) => void;
}) {
  return (
    <Card
      id={sectionId}
      className="scroll-mt-24 rounded-[16px] border-slate-200 bg-white"
    >
      <CardContent className="space-y-5 p-5">
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
                <span className="text-xs text-[#294066]">
                  {issues.length} fix{issues.length === 1 ? "" : "es"}
                </span>
              </div>
              {issues.length === 0 ? (
                <div className="rounded-[12px] border border-slate-200 bg-slate-50 p-4 text-sm text-[#294066]">
                  No {severity} priority fixes in this audit.
                </div>
              ) : (
                issues.map((issue) => (
                  <div
                    key={issue.code}
                    className="flex flex-col gap-3 rounded-[12px] border border-slate-200 bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.035)] transition duration-300 hover:border-indigo-200 hover:bg-indigo-50/20 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full", severityStyles[issue.severity].dot)} />
                        <p className="font-semibold text-[#101936]">{issue.title}</p>
                      </div>
                      <p className="text-sm leading-6 text-[#294066]">
                        {issue.recommendation}
                      </p>
                      <p className="text-xs font-medium text-slate-500">
                        Estimated impact: {issue.impact}/100
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onViewFix(issue)}
                      className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-[10px] border border-indigo-200 bg-indigo-50 px-4 text-xs font-semibold text-[#4437ff] transition duration-300 hover:-translate-y-0.5 hover:bg-indigo-100"
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
  sectionId,
  report,
  allIssues,
  onViewFix,
}: {
  sectionId?: string;
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
    <Card
      id={sectionId}
      className="relative scroll-mt-24 overflow-hidden rounded-[16px] border-slate-200 bg-white"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-50/60 via-white to-white" />
      <CardContent className="relative space-y-5 p-5">
        <SectionHeading
          icon={Sparkles}
          title="AI SEO Insights"
          description={
            report.aiInsights.generated
              ? `Generated with ${report.aiInsights.provider} ${report.aiInsights.model ?? ""}`.trim()
              : "Fallback guidance from the built-in EFFIX audit intelligence."
          }
        />
        <div className="rounded-[14px] border border-indigo-100 bg-white p-5 shadow-sm">
          <p className="text-sm leading-7 text-[#294066]">
            {report.aiInsights.summary}
          </p>
          {!report.aiInsights.generated && report.aiInsights.fallbackReason ? (
            <p className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-5 text-amber-700">
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
      <h4 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
        {title}
      </h4>
      {issues.length === 0 ? (
        <p className="rounded-[12px] border border-slate-200 bg-slate-50 p-3 text-sm text-[#294066]">
          {empty}
        </p>
      ) : (
        issues.map((issue) => (
          <button
            key={issue.code}
            type="button"
            onClick={() => onViewFix(issue)}
            className="flex w-full items-center justify-between gap-3 rounded-[12px] border border-slate-200 bg-white p-3 text-left transition duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/40"
          >
            <span className="min-w-0 text-sm font-medium text-[#101936]">
              {issue.recommendation}
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-[#4437ff]" />
          </button>
        ))
      )}
    </div>
  );
}

function PageSignalsCard({ report }: { report: EnrichedAuditResponse }) {
  return (
    <Card className="rounded-[16px] border-slate-200 bg-white">
      <CardContent className="space-y-5 p-5">
        <SectionHeading
          icon={BarChart3}
          title="Site Overview"
          description="Parsed site signals from the current audit run."
        />
        <div className="space-y-3">
          {[
            ["Pages Crawled", "1"],
            ["Total Issues", String(report.technicalIssues.length + report.contentIssues.length + report.aiVisibilityIssues.length)],
            ["Indexable Signals", report.metadata.canonicalUrl ? "Strong" : "Review"],
            ["Internal Links", String(report.metadata.internalLinkCount)],
            ["External Links", String(report.metadata.externalLinkCount)],
            ["Images Missing Alt", String(report.metadata.missingImageAltCount)],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="text-[#294066]">{label}</span>
              <span className="font-bold text-[#101936]">{value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreHistoryCard({ score }: { score: number }) {
  return (
    <Card className="rounded-[16px] border-slate-200 bg-white">
      <CardContent className="space-y-5 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-[#101936]">
            Score History
          </h3>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
            +12%
          </span>
        </div>
        <MiniLineChart values={buildTrend(score)} />
        <div className="flex justify-between text-xs text-[#294066]">
          <span>Apr 16</span>
          <span>Apr 30</span>
          <span>May 14</span>
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
      <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-indigo-50 text-[#4437ff]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h3 className="font-display text-lg font-bold tracking-tight text-[#101936]">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-6 text-[#294066]">{description}</p>
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
                ? "border-indigo-200 bg-indigo-50 text-[#4437ff] shadow-sm"
                : "border-slate-200 bg-white text-[#294066] hover:-translate-y-0.5 hover:border-indigo-200 hover:text-[#4437ff]",
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
    <div className="rounded-[12px] border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-[#294066]">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[14px] border border-slate-200 bg-white p-4 text-center shadow-sm">
      <p className="font-display text-3xl font-bold text-[#101936]">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
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
    <div className="rounded-[14px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)] transition duration-300 hover:border-indigo-200">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-[#101936]">{label}</p>
          <p className="mt-1 text-sm text-[#294066]">{detail}</p>
        </div>
        <p className="font-display text-2xl font-bold text-[#101936]">{normalized}</p>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${normalized}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full bg-gradient-to-r from-[#4437ff] via-[#7c5cff] to-[#21c48d]"
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
          className="rounded-[14px] border border-slate-200 bg-white p-4"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 break-words text-sm font-semibold text-[#101936]">
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
      <h4 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
        {title}
      </h4>
      {items.map((item) => (
        <div
          key={item}
          className="flex gap-3 rounded-[14px] border border-slate-200 bg-white p-4 text-sm leading-6 text-[#294066]"
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
    <div className="rounded-[14px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-[#101936]">{issue.title}</p>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
            severityStyles[issue.severity].badge,
          )}
        >
          {issue.severity}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-[#294066]">
        {issue.recommendation}
      </p>
    </div>
  );
}

function MiniLineChart({ values }: { values: number[] }) {
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - Math.max(0, Math.min(100, value));
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="group relative h-36 overflow-hidden rounded-[14px] bg-gradient-to-b from-indigo-50 to-white p-3">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
        <defs>
          <linearGradient id="scoreArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4437ff" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#4437ff" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <motion.polyline
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          points={`0,100 ${points} 100,100`}
          fill="url(#scoreArea)"
          stroke="none"
        />
        <motion.polyline
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          points={points}
          fill="none"
          stroke="#4437ff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-[#4437ff] opacity-0 shadow-sm transition duration-300 group-hover:opacity-100">
        Interactive trend
      </div>
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
            : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
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
