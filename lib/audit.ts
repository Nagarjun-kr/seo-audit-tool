export type {
  AiAuditInsights,
  AiIssueRecommendation,
  AuditIssue,
  AuditIssueCategory,
  AuditIssueSeverity,
  AuditMetadata,
  AuditRequest,
  AuditResponse,
  AuditScoreBreakdown,
  EnrichedAuditResponse,
  ExtractedSeoData,
} from "@/lib/seo-audit/types";

export { runSeoAudit } from "@/lib/seo-audit";
