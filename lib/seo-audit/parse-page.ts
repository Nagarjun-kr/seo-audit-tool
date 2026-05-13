import { load } from "cheerio";

import type { ExtractedSeoData } from "@/lib/seo-audit/types";

const FAQ_PATTERN =
  /\b(faq|frequently asked questions|questions|common questions)\b/i;

export function parseSeoData(html: string, finalUrl: string): ExtractedSeoData {
  const $ = load(html);
  const pageUrl = new URL(finalUrl);
  const title = $("title").first().text().trim();
  const metaDescription = $('meta[name="description"]').attr("content")?.trim() || "";
  const canonicalHref = $('link[rel="canonical"]').attr("href")?.trim() || null;
  const viewport = $('meta[name="viewport"]').attr("content")?.trim() || null;

  const h1s = $("h1")
    .map((_, element) => $(element).text().replace(/\s+/g, " ").trim())
    .get()
    .filter(Boolean);

  const h2s = $("h2")
    .map((_, element) => $(element).text().replace(/\s+/g, " ").trim())
    .get()
    .filter(Boolean);

  const paragraphs = $("p")
    .map((_, element) => $(element).text().replace(/\s+/g, " ").trim())
    .get()
    .filter(Boolean);

  const longParagraphCount = paragraphs.filter(
    (paragraph) => paragraph.split(/\s+/).length > 120,
  ).length;

  const wordCount = paragraphs.reduce((total, paragraph) => {
    return total + paragraph.split(/\s+/).filter(Boolean).length;
  }, 0);

  const imageAltTags = $("img")
    .map((_, element) => ({
      src: $(element).attr("src")?.trim() || "",
      alt: $(element).attr("alt")?.trim() || "",
    }))
    .get();

  const missingImageAltCount = imageAltTags.filter((image) => !image.alt).length;

  const allLinks = $("a[href]")
    .map((_, element) => $(element).attr("href")?.trim() || "")
    .get()
    .filter(Boolean);

  const resolvedLinks = allLinks
    .map((href) => resolveUrl(href, pageUrl))
    .filter((href): href is string => Boolean(href));

  const internalLinks = unique(
    resolvedLinks.filter((href) => new URL(href).hostname === pageUrl.hostname),
  );
  const externalLinks = unique(
    resolvedLinks.filter((href) => new URL(href).hostname !== pageUrl.hostname),
  );

  const faqHeadings = [...h1s, ...h2s].filter((heading) =>
    FAQ_PATTERN.test(heading),
  );

  return {
    finalUrl,
    title,
    metaDescription,
    h1s,
    h2s,
    canonicalUrl: canonicalHref ? resolveUrl(canonicalHref, pageUrl) : null,
    imageAltTags,
    internalLinks,
    externalLinks,
    viewport,
    paragraphs,
    faqHeadings,
    wordCount,
    longParagraphCount,
    missingImageAltCount,
  };
}

function resolveUrl(href: string, baseUrl: URL) {
  if (
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:")
  ) {
    return null;
  }

  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function unique(values: string[]) {
  return [...new Set(values)];
}
