import Groq from "groq-sdk";

import type {
  AiAuditInsights,
  AiIssueRecommendation,
  AuditIssue,
  AuditScoreBreakdown,
} from "@/lib/seo-audit/types";

const GROQ_MODEL = "llama-3.1-8b-instant";
const MAX_AI_ISSUES = 8;

type GenerateAiInsightsInput = {
  score: number;
  scoreBreakdown: AuditScoreBreakdown;
  technicalIssues: AuditIssue[];
  contentIssues: AuditIssue[];
  aiVisibilityIssues: AuditIssue[];
};

type GroqAiPayload = {
  summary: string;
  issueRecommendations: AiIssueRecommendation[];
};

export async function generateAiAuditInsights(
  input: GenerateAiInsightsInput,
): Promise<AiAuditInsights> {
  const allIssues = [
    ...input.technicalIssues,
    ...input.contentIssues,
    ...input.aiVisibilityIssues,
  ];

  if (allIssues.length === 0) {
    return {
      provider: "fallback",
      model: null,
      generated: false,
      summary:
        "This page is in relatively strong shape based on the current audit rules. Focus on keeping metadata, structure, and content depth consistent as the site grows.",
      issueRecommendations: [],
      fallbackReason: "No issues were available for AI expansion.",
    };
  }

  if (!process.env.GROQ_API_KEY) {
    return buildFallbackInsights(allIssues, "Missing GROQ_API_KEY.");
  }

  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
      timeout: 8000,
      maxRetries: 1,
    });

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an experienced SEO strategist writing for clients. Return JSON only. Sound human, professional, and concise. Avoid repetitive wording, avoid repeating severity labels, and focus on specific SEO actions that improve rankings, crawlability, CTR, structure, and AI answer visibility. Keep the summary under 3 short paragraphs total, and keep each recommendation field tight and practical. Do not use markdown.",
        },
        {
          role: "user",
          content: buildPrompt(input),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return buildFallbackInsights(allIssues, "Groq returned an empty response.");
    }

    const parsed = JSON.parse(content) as GroqAiPayload;

    return {
      provider: "groq",
      model: GROQ_MODEL,
      generated: true,
      summary:
        parsed.summary?.trim() ||
        "The audit highlights several meaningful SEO improvements with clear prioritization opportunities.",
      issueRecommendations: sanitizeIssueRecommendations(
        parsed.issueRecommendations,
        allIssues,
      ),
    };
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Groq request failed unexpectedly.";
    return buildFallbackInsights(allIssues, reason);
  }
}

function buildPrompt(input: GenerateAiInsightsInput) {
  const issues = [
    ...input.technicalIssues,
    ...input.contentIssues,
    ...input.aiVisibilityIssues,
  ]
    .slice(0, MAX_AI_ISSUES)
    .map((issue) => ({
      issueCode: issue.code,
      category: issue.category,
      severity: issue.severity,
      title: issue.title,
      description: issue.description,
      recommendation: issue.recommendation,
      impact: issue.impact,
    }));

  return JSON.stringify({
    task: "Turn this SEO audit into concise, practical client-ready guidance.",
    requirements: {
      tone: ["concise", "human", "professional", "SEO-focused", "readable"],
      fields: [
        "whyItMatters",
        "seoImpact",
        "actionableFix",
        "exampleImprovement",
        "priorityExplanation",
      ],
      responseSchema: {
        summary: "string",
        issueRecommendations: [
          {
            issueCode: "string",
            whyItMatters: "string",
            seoImpact: "string",
            actionableFix: "string",
            exampleImprovement: "string",
            priorityExplanation: "string",
          },
        ],
      },
      constraints: [
        "Write the summary in at most 3 short paragraphs total.",
        "Keep each field to 1 short sentence whenever possible.",
        "Do not repeat the issue title or severity in every field.",
        "Prefer direct verbs and concrete SEO advice over generic commentary.",
        "Keep exampleImprovement practical, specific, and brief.",
        "Mention ranking, CTR, crawlability, entity clarity, internal linking, or answer visibility only when relevant.",
        "Vary sentence openings so the output does not sound repetitive.",
        "Return valid JSON only.",
      ],
    },
    audit: {
      score: input.score,
      scoreBreakdown: input.scoreBreakdown,
      issues,
    },
  });
}

function sanitizeIssueRecommendations(
  issueRecommendations: AiIssueRecommendation[] | undefined,
  auditIssues: AuditIssue[],
) {
  if (!Array.isArray(issueRecommendations) || issueRecommendations.length === 0) {
    return buildFallbackIssueRecommendations(auditIssues);
  }

  const validCodes = new Set(auditIssues.map((issue) => issue.code));

  return issueRecommendations
    .filter((item) => validCodes.has(item.issueCode))
    .map((item) => ({
      issueCode: item.issueCode,
      whyItMatters: cleanAiText(item.whyItMatters),
      seoImpact: cleanAiText(item.seoImpact),
      actionableFix: cleanAiText(item.actionableFix),
      exampleImprovement: cleanAiText(item.exampleImprovement),
      priorityExplanation: cleanAiText(item.priorityExplanation),
    }));
}

function buildFallbackInsights(
  issues: AuditIssue[],
  fallbackReason: string,
): AiAuditInsights {
  return {
    provider: "fallback",
    model: null,
    generated: false,
    summary:
      "AI enhancement is currently unavailable, so these recommendations are based on the built-in SEO rules and issue severity.",
    issueRecommendations: buildFallbackIssueRecommendations(issues),
    fallbackReason,
  };
}

function buildFallbackIssueRecommendations(issues: AuditIssue[]) {
  return issues.slice(0, MAX_AI_ISSUES).map((issue) => ({
    issueCode: issue.code,
    whyItMatters: buildWhyItMatters(issue),
    seoImpact: buildSeoImpact(issue),
    actionableFix: issue.recommendation,
    exampleImprovement: buildExampleImprovement(issue),
    priorityExplanation: buildPriorityExplanation(issue),
  }));
}

function buildWhyItMatters(issue: AuditIssue) {
  return `${issue.title} affects how clearly search engines and users understand the page's relevance and quality.`;
}

function buildSeoImpact(issue: AuditIssue) {
  return issue.severity === "high"
    ? "This can materially reduce rankings, crawl confidence, or click-through rate on important queries."
    : issue.severity === "medium"
      ? "This can weaken search visibility, topical clarity, or SERP performance over time."
      : "This is a supporting optimization that can improve usability and contextual SEO signals.";
}

function buildExampleImprovement(issue: AuditIssue) {
  return issue.code === "missing-title"
    ? "Example: use a title like 'Technical SEO Audit Services | Brand Name' instead of leaving the page untitled."
    : issue.code === "missing-meta-description"
      ? "Example: add a 140- to 155-character description that summarizes the page value and includes the main topic."
      : issue.code === "missing-h1"
        ? "Example: add one H1 that matches the page intent, such as 'SEO Audit & AI Visibility Tool'."
        : "Example: update the page section directly so the fix is visible in the rendered HTML and aligns with the page topic.";
}

function buildPriorityExplanation(issue: AuditIssue) {
  return issue.severity === "high"
    ? "Prioritize this first because it influences core search understanding or key organic performance signals."
    : issue.severity === "medium"
      ? "Handle this after critical fixes because it strengthens quality and topical coverage."
      : "Treat this as a secondary optimization once major technical and content gaps are resolved.";
}

function safeSentence(value: string | undefined) {
  return value?.trim() || "No additional detail was generated for this item.";
}

function cleanAiText(value: string | undefined) {
  const text = safeSentence(value)
    .replace(/\b(high|medium|low)\s+severity\b/gi, "")
    .replace(/\b(high|medium|low)\s+priority\b/gi, "")
    .replace(/\bthis issue\b/gi, "this")
    .replace(/\s{2,}/g, " ")
    .trim();

  return text || "No additional detail was generated for this item.";
}
