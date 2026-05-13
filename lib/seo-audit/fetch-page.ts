const REQUEST_TIMEOUT_MS = 10000;

export class AuditRouteError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AuditRouteError";
    this.status = status;
  }
}

export async function fetchPageHtml(rawUrl: string) {
  const normalizedUrl = normalizeUrl(rawUrl);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(normalizedUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; SEOAuditBot/1.0; +https://example.com/bot)",
        accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
    });

    if ([401, 403, 406, 429, 451].includes(response.status)) {
      throw new AuditRouteError(
        "This website blocks automated access, so the audit could not be completed.",
        403,
      );
    }

    if (!response.ok) {
      throw new AuditRouteError(
        `Unable to fetch the target page. The website responded with status ${response.status}.`,
        response.status >= 500 ? 502 : 400,
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      throw new AuditRouteError(
        "The target URL did not return an HTML document.",
        400,
      );
    }

    const html = await response.text();

    if (!html.trim()) {
      throw new AuditRouteError(
        "The target page returned empty HTML content.",
        400,
      );
    }

    return {
      html,
      finalUrl: response.url || normalizedUrl,
      statusCode: response.status,
    };
  } catch (error) {
    if (error instanceof AuditRouteError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new AuditRouteError(
        "The audit timed out while waiting for the website to respond.",
        504,
      );
    }

    throw new AuditRouteError(
      "The website could not be fetched. Please verify the URL and try again.",
      502,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeUrl(rawUrl: string) {
  const trimmedUrl = rawUrl.trim();
  const candidate = /^https?:\/\//i.test(trimmedUrl)
    ? trimmedUrl
    : `https://${trimmedUrl}`;

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(candidate);
  } catch {
    throw new AuditRouteError("Please enter a valid website URL.", 400);
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new AuditRouteError("Only HTTP and HTTPS URLs are supported.", 400);
  }

  return parsedUrl.toString();
}
