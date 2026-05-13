export type AuditIssueSeverity = "high" | "medium" | "low";
export type AuditIssueCategory =
  | "technical"
  | "content"
  | "ai-visibility";

export type AuditIssue = {
  code: string;
  category: AuditIssueCategory;
  severity: AuditIssueSeverity;
  title: string;
  description: string;
  recommendation: string;
  impact: number;
};

export type AiIssueRecommendation = {
  issueCode: string;
  whyItMatters: string;
  seoImpact: string;
  actionableFix: string;
  exampleImprovement: string;
  priorityExplanation: string;
};

export type AiAuditInsights = {
  provider: "groq" | "fallback";
  model: string | null;
  generated: boolean;
  summary: string;
  issueRecommendations: AiIssueRecommendation[];
  fallbackReason?: string;
};

export type ExtractedSeoData = {
  finalUrl: string;
  title: string;
  metaDescription: string;
  h1s: string[];
  h2s: string[];
  canonicalUrl: string | null;
  imageAltTags: Array<{
    src: string;
    alt: string;
  }>;
  internalLinks: string[];
  externalLinks: string[];
  viewport: string | null;
  paragraphs: string[];
  faqHeadings: string[];
  wordCount: number;
  longParagraphCount: number;
  missingImageAltCount: number;
};

export type AuditMetadata = {
  url: string;
  hostname: string;
  fetchedAt: string;
  statusCode: number;
  title: string;
  metaDescription: string;
  canonicalUrl: string | null;
  h1s: string[];
  h2s: string[];
  imageAltTags: Array<{
    src: string;
    alt: string;
  }>;
  internalLinks: string[];
  externalLinks: string[];
  viewport: string | null;
  paragraphs: string[];
  faqHeadings: string[];
  wordCount: number;
  internalLinkCount: number;
  externalLinkCount: number;
  imageCount: number;
  missingImageAltCount: number;
  longParagraphCount: number;
};

export type AuditScoreBreakdown = {
  overall: number;
  technical: number;
  content: number;
  aiVisibility: number;
};

export type AuditResponse = {
  score: number;
  scoreBreakdown: AuditScoreBreakdown;
  technicalIssues: AuditIssue[];
  contentIssues: AuditIssue[];
  aiVisibilityIssues: AuditIssue[];
  recommendations: string[];
  metadata: AuditMetadata;
};

export type EnrichedAuditResponse = AuditResponse & {
  aiInsights: AiAuditInsights;
};

export type AuditRequest = {
  url?: string;
};
