import { NextResponse } from "next/server";
import { ensureDineLeakDatabaseSchema } from "@/lib/database-schema";
import { listAuditRunsBySubscriptionId } from "@/lib/audit-storage";
import { findRecurringSubscriptionByEmail } from "@/lib/monitoring-storage";
import { checkReportLookupRateLimit, getReportLookupIpHash, recordReportLookupAttempt } from "@/lib/report-access-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LookupBody = {
  email?: string;
};

function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function summarizeReport(result: Record<string, unknown>) {
  const categories = Array.isArray(result.categories) ? result.categories : [];
  const opportunities = Array.isArray(result.opportunities) ? result.opportunities : [];
  const topIssues = categories
    .slice(0, 3)
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const category = entry as Record<string, unknown>;
      const name = typeof category.name === "string" ? category.name : "Issue";
      const issue = typeof category.issue === "string" ? category.issue : "";
      return issue ? `${name}: ${issue}` : name;
    })
    .filter(Boolean) as string[];
  const topRecommendations = opportunities
    .slice(0, 2)
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const opportunity = entry as Record<string, unknown>;
      return typeof opportunity.title === "string" ? opportunity.title : null;
    })
    .filter(Boolean) as string[];

  return {
    headline: typeof result.headline === "string" ? result.headline : null,
    topIssues,
    topRecommendations,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LookupBody;
    const email = normalizeEmail(body.email);

    if (!email) {
      return NextResponse.json({ found: false, message: "Enter the email used at checkout." }, { status: 400 });
    }

    const ipHash = getReportLookupIpHash(request);
    await recordReportLookupAttempt(ipHash, email);
    const rateLimit = await checkReportLookupRateLimit(ipHash);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          found: false,
          message: "You’ve reached the report lookup limit. Please wait a bit before trying again.",
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        { status: 429 },
      );
    }

    await ensureDineLeakDatabaseSchema();
    const subscription = await findRecurringSubscriptionByEmail(email);

    if (!subscription) {
      return NextResponse.json({
        found: false,
        customerEmail: email,
        subscription: null,
        reports: [],
        message: "No DineLeak Monitor subscription was found for that email. Use the same email you entered at checkout.",
      });
    }

    const audits = await listAuditRunsBySubscriptionId(subscription.subscriptionId, 12);
    const reports = audits.map((audit) => {
      const score = typeof audit.result.score === "number" ? audit.result.score : null;
      const summary = summarizeReport(audit.result as Record<string, unknown>);

      return {
        restaurantName: audit.restaurantName,
        website: audit.restaurantWebsite,
        createdAt: audit.createdAt,
        status: subscription.active ? "Active" : subscription.stripeStatus ?? "Inactive",
        score,
        scanType: audit.scanType,
        headline: summary.headline,
        topIssues: summary.topIssues,
        topRecommendations: summary.topRecommendations,
      };
    });

    return NextResponse.json({
      found: true,
      customerEmail: email,
      subscription: {
        active: subscription.active,
        stripeStatus: subscription.stripeStatus,
        intervalDays: subscription.intervalDays,
        nextScanAt: subscription.nextScanAt,
        lastScanAt: subscription.lastScanAt,
        scanCount: subscription.scanCount,
        productType: subscription.productType,
      },
      reports,
      message: reports.length
        ? null
        : "Your subscription is active. Your first monitoring report will appear after the next scan runs.",
    });
  } catch (error) {
    console.error("[dineleak] report lookup failed", error);
    return NextResponse.json({ found: false, message: "Unable to look up reports right now." }, { status: 500 });
  }
}
