import type {
  AuditIssue,
  AuditIssueCategory,
  AuditIssueSeverity,
  AuditResponse,
  AuditScoreBreakdown,
  ExtractedSeoData,
} from "@/lib/seo-audit/types";

const SCORE_WEIGHTS: Record<AuditIssueCategory, number> = {
  technical: 0.4,
  content: 0.35,
  "ai-visibility": 0.25,
};

export function buildAuditResult(input: {
  url: string;
  statusCode: number;
  data: ExtractedSeoData;
}): AuditResponse {
  const { url, statusCode, data } = input;
  const issues = [
    ...runTechnicalChecks(data),
    ...runContentChecks(data),
    ...runAiVisibilityChecks(data),
  ];

  const technicalIssues = issues.filter((issue) => issue.category === "technical");
  const contentIssues = issues.filter((issue) => issue.category === "content");
  const aiVisibilityIssues = issues.filter(
    (issue) => issue.category === "ai-visibility",
  );

  const scoreBreakdown = calculateScores({
    technical: technicalIssues,
    content: contentIssues,
    "ai-visibility": aiVisibilityIssues,
  });

  return {
    score: scoreBreakdown.overall,
    scoreBreakdown,
    technicalIssues,
    contentIssues,
    aiVisibilityIssues,
    recommendations: uniqueRecommendations(issues),
    metadata: {
      url,
      hostname: new URL(data.finalUrl).hostname.replace(/^www\./, ""),
      fetchedAt: new Date().toISOString(),
      statusCode,
      title: data.title,
      metaDescription: data.metaDescription,
      canonicalUrl: data.canonicalUrl,
      h1s: data.h1s,
      h2s: data.h2s,
      imageAltTags: data.imageAltTags,
      internalLinks: data.internalLinks,
      externalLinks: data.externalLinks,
      viewport: data.viewport,
      paragraphs: data.paragraphs,
      faqHeadings: data.faqHeadings,
      wordCount: data.wordCount,
      internalLinkCount: data.internalLinks.length,
      externalLinkCount: data.externalLinks.length,
      imageCount: data.imageAltTags.length,
      missingImageAltCount: data.missingImageAltCount,
      longParagraphCount: data.longParagraphCount,
    },
  };
}

function runTechnicalChecks(data: ExtractedSeoData) {
  const issues: AuditIssue[] = [];

  if (!data.title) {
    issues.push(
      createIssue({
        code: "missing-title",
        category: "technical",
        severity: "high",
        title: "Missing title tag",
        description: "The page does not include a title tag.",
        recommendation:
          "Add a unique title tag that clearly describes the page topic and intent.",
        impact: 18,
      }),
    );
  } else if (data.title.length < 30 || data.title.length > 60) {
    issues.push(
      createIssue({
        code: "title-length",
        category: "technical",
        severity: "medium",
        title: "Title length is outside the ideal range",
        description: `The title is ${data.title.length} characters long. Aim for roughly 30 to 60 characters.`,
        recommendation:
          "Rewrite the title so it is descriptive, keyword-focused, and within the ideal SERP length.",
        impact: 9,
      }),
    );
  }

  if (!data.metaDescription) {
    issues.push(
      createIssue({
        code: "missing-meta-description",
        category: "technical",
        severity: "high",
        title: "Missing meta description",
        description: "The page is missing a meta description.",
        recommendation:
          "Add a compelling meta description that summarizes the page and encourages clicks.",
        impact: 14,
      }),
    );
  } else if (
    data.metaDescription.length < 70 ||
    data.metaDescription.length > 160
  ) {
    issues.push(
      createIssue({
        code: "meta-description-length",
        category: "technical",
        severity: "medium",
        title: "Meta description length needs improvement",
        description: `The meta description is ${data.metaDescription.length} characters long. Aim for about 70 to 160 characters.`,
        recommendation:
          "Refine the meta description so it is concise, readable, and within a healthy length range.",
        impact: 8,
      }),
    );
  }

  if (!data.canonicalUrl) {
    issues.push(
      createIssue({
        code: "missing-canonical",
        category: "technical",
        severity: "medium",
        title: "Missing canonical tag",
        description: "The page does not declare a canonical URL.",
        recommendation:
          "Add a canonical tag to help search engines understand the preferred version of the page.",
        impact: 9,
      }),
    );
  }

  if (!data.viewport) {
    issues.push(
      createIssue({
        code: "missing-viewport",
        category: "technical",
        severity: "high",
        title: "Missing mobile viewport tag",
        description: "The page does not contain a viewport meta tag.",
        recommendation:
          "Add a viewport tag so the page renders correctly on mobile devices.",
        impact: 12,
      }),
    );
  }

  if (data.missingImageAltCount > 0) {
    issues.push(
      createIssue({
        code: "missing-image-alt",
        category: "technical",
        severity: data.missingImageAltCount > 3 ? "high" : "medium",
        title: "Some images are missing alt text",
        description: `${data.missingImageAltCount} image${data.missingImageAltCount === 1 ? " is" : "s are"} missing alt text.`,
        recommendation:
          "Add descriptive alt text to meaningful images for accessibility and richer search understanding.",
        impact: Math.min(14, 4 + data.missingImageAltCount * 2),
      }),
    );
  }

  return issues;
}

function runContentChecks(data: ExtractedSeoData) {
  const issues: AuditIssue[] = [];

  if (data.h1s.length === 0) {
    issues.push(
      createIssue({
        code: "missing-h1",
        category: "content",
        severity: "high",
        title: "Missing H1 heading",
        description: "The page does not include an H1 heading.",
        recommendation:
          "Add one clear H1 that communicates the primary topic of the page.",
        impact: 15,
      }),
    );
  } else if (data.h1s.length > 1) {
    issues.push(
      createIssue({
        code: "multiple-h1",
        category: "content",
        severity: "medium",
        title: "Multiple H1 headings found",
        description: `The page contains ${data.h1s.length} H1 headings, which can dilute topical focus.`,
        recommendation:
          "Use a single primary H1 and organize supporting topics under H2 and H3 headings.",
        impact: 9,
      }),
    );
  }

  if (data.h2s.length === 0 || (data.h1s.length > 0 && data.h2s.length < 2)) {
    issues.push(
      createIssue({
        code: "weak-heading-hierarchy",
        category: "content",
        severity: "medium",
        title: "Weak heading hierarchy",
        description:
          "The page has limited heading structure, which can make it harder to scan and understand.",
        recommendation:
          "Break the page into clear sections with descriptive H2 headings supporting the main H1.",
        impact: 10,
      }),
    );
  }

  if (data.wordCount < 300) {
    issues.push(
      createIssue({
        code: "low-word-count",
        category: "content",
        severity: "high",
        title: "Low word count",
        description: `The page contains about ${data.wordCount} words in paragraph copy, which may be too thin for competitive queries.`,
        recommendation:
          "Expand the page with useful, intent-matched copy that answers key user questions.",
        impact: 16,
      }),
    );
  }

  if (data.longParagraphCount > 0) {
    issues.push(
      createIssue({
        code: "long-paragraphs",
        category: "content",
        severity: "low",
        title: "Long paragraphs reduce readability",
        description: `${data.longParagraphCount} paragraph${data.longParagraphCount === 1 ? " is" : "s are"} longer than 120 words.`,
        recommendation:
          "Split long paragraphs into shorter sections to improve readability and comprehension.",
        impact: Math.min(8, 2 + data.longParagraphCount),
      }),
    );
  }

  return issues;
}

function runAiVisibilityChecks(data: ExtractedSeoData) {
  const issues: AuditIssue[] = [];

  if (data.faqHeadings.length === 0) {
    issues.push(
      createIssue({
        code: "missing-faq-section",
        category: "ai-visibility",
        severity: "medium",
        title: "Missing FAQ-style section",
        description:
          "No FAQ-oriented heading was found, which can reduce answer-engine coverage for question-based searches.",
        recommendation:
          "Add an FAQ or question-led section that addresses common user concerns directly.",
        impact: 10,
      }),
    );
  }

  if (data.internalLinks.length < 3) {
    issues.push(
      createIssue({
        code: "limited-internal-links",
        category: "ai-visibility",
        severity: "low",
        title: "Internal linking is limited",
        description:
          "The page has only a small number of internal links, which may weaken contextual site signals.",
        recommendation:
          "Add relevant internal links to supporting pages, comparisons, guides, and conversion pages.",
        impact: 6,
      }),
    );
  }

  if (!data.metaDescription || data.wordCount < 450) {
    issues.push(
      createIssue({
        code: "thin-answer-coverage",
        category: "ai-visibility",
        severity: "medium",
        title: "Answer coverage looks thin",
        description:
          "The page may not provide enough concise supporting detail for AI-generated answers and summaries.",
        recommendation:
          "Add concise definitions, comparisons, steps, and direct answers near the top of the page.",
        impact: 11,
      }),
    );
  }

  return issues;
}

function calculateScores(issuesByCategory: Record<AuditIssueCategory, AuditIssue[]>) {
  const technical = categoryScore(issuesByCategory.technical);
  const content = categoryScore(issuesByCategory.content);
  const aiVisibility = categoryScore(issuesByCategory["ai-visibility"]);
  const overall = Math.round(
    technical * SCORE_WEIGHTS.technical +
      content * SCORE_WEIGHTS.content +
      aiVisibility * SCORE_WEIGHTS["ai-visibility"],
  );

  return {
    overall,
    technical,
    content,
    aiVisibility,
  } satisfies AuditScoreBreakdown;
}

function categoryScore(issues: AuditIssue[]) {
  const totalImpact = issues.reduce((sum, issue) => sum + issue.impact, 0);
  return Math.max(0, Math.round(100 - Math.min(totalImpact, 100)));
}

function uniqueRecommendations(issues: AuditIssue[]) {
  return [...new Set(issues.map((issue) => issue.recommendation))];
}

function createIssue(issue: AuditIssue) {
  return issue;
}
