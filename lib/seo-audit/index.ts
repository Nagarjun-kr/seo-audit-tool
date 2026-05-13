import { fetchPageHtml } from "@/lib/seo-audit/fetch-page";
import { generateAiAuditInsights } from "@/lib/seo-audit/ai-recommendations";
import { parseSeoData } from "@/lib/seo-audit/parse-page";
import { buildAuditResult } from "@/lib/seo-audit/rules";
import type { EnrichedAuditResponse } from "@/lib/seo-audit/types";

export async function runSeoAudit(rawUrl: string): Promise<EnrichedAuditResponse> {
  const page = await fetchPageHtml(rawUrl);
  const data = parseSeoData(page.html, page.finalUrl);
  const auditResult = buildAuditResult({
    url: rawUrl.trim(),
    statusCode: page.statusCode,
    data,
  });

  const aiInsights = await generateAiAuditInsights({
    score: auditResult.score,
    scoreBreakdown: auditResult.scoreBreakdown,
    technicalIssues: auditResult.technicalIssues,
    contentIssues: auditResult.contentIssues,
    aiVisibilityIssues: auditResult.aiVisibilityIssues,
  });

  return {
    ...auditResult,
    aiInsights,
  };
}
