import { NextResponse } from "next/server";

import { runSeoAudit } from "@/lib/audit";
import type { AuditRequest } from "@/lib/audit";
import { AuditRouteError } from "@/lib/seo-audit/fetch-page";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AuditRequest;
    const submittedUrl = body.url?.trim();

    if (!submittedUrl) {
      return NextResponse.json(
        { error: "A valid URL is required." },
        { status: 400 },
      );
    }

    const result = await runSeoAudit(submittedUrl);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuditRouteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "The request body must be valid JSON." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "The audit could not be completed due to an unexpected error." },
      { status: 500 },
    );
  }
}
