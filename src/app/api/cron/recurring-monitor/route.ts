import { NextResponse } from "next/server";
import { generateAudit, type AuditInput } from "@/lib/audit";
import { buildMonitoringSummary } from "@/lib/audit-history";
import { saveAuditRun, findLatestAuditRunByRestaurant, findLatestAuditRunBySubscriptionId } from "@/lib/audit-storage";
import { generateOpenAIAuditWithOptions } from "@/lib/openai-audit";
import {
  findRecurringSubscription,
  listDueRecurringSubscriptions,
  markRecurringScanComplete,
  markRecurringScanFailed,
  setRecurringSubscriptionInactive,
} from "@/lib/monitoring-storage";
import { fetchWebsiteSnapshot } from "@/lib/website-snapshot";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const configuredSecret = process.env.CRON_SECRET?.trim();
  if (!configuredSecret) {
    return process.env.NODE_ENV !== "production";
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${configuredSecret}`;
}

function getNextScanAt(plan: "starter" | "pro") {
  const intervalDays = plan === "pro" ? 7 : 30;
  return new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000).toISOString();
}

function buildInputFromSubscription(subscription: Awaited<ReturnType<typeof findRecurringSubscription>>) {
  if (!subscription?.restaurantName || !subscription.restaurantWebsite) return null;

  return {
    restaurant: subscription.restaurantName || "",
    website: subscription.restaurantWebsite || "",
    instagram: subscription.restaurantInstagram || "",
    tiktok: subscription.restaurantTikTok || "",
    cuisine: subscription.cuisine || "",
    city: subscription.city || "",
  } satisfies AuditInput;
}

async function processRecurringSubscription(subscriptionId: string) {
  const stripe = getStripe();
  const monitoringSubscription = await findRecurringSubscription(subscriptionId);

  if (!monitoringSubscription) {
    return { processed: false, reason: "missing-subscription" };
  }

  console.info("[dineintel] recurring scan started", {
    subscriptionId,
    restaurantName: monitoringSubscription.restaurantName,
    productType: monitoringSubscription.productType,
  });

  try {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (stripeSubscription.status !== "active") {
      await setRecurringSubscriptionInactive({
        subscriptionId,
        stripeStatus: stripeSubscription.status,
      });

      console.info("[dineintel] recurring scan skipped inactive subscription", {
        subscriptionId,
        stripeStatus: stripeSubscription.status,
      });

      return { processed: false, reason: "inactive-subscription" };
    }

    const input = buildInputFromSubscription(monitoringSubscription);
    if (!input) {
      throw new Error("Missing restaurant details for recurring scan.");
    }

    const previousAudit =
      (await findLatestAuditRunBySubscriptionId(subscriptionId)) ??
      (await findLatestAuditRunByRestaurant(input.restaurant, input.website));

    const snapshot = await fetchWebsiteSnapshot(input.website);
    const aiResult = await generateOpenAIAuditWithOptions(input, snapshot, {
      previousAudit: previousAudit?.result ?? null,
      monitoringPlan: monitoringSubscription.productType,
      retries: 1,
    });
    const result = aiResult ?? generateAudit(input);
    const monitoring = buildMonitoringSummary(previousAudit?.result ?? null, result);
    monitoring.previousAuditId = previousAudit?.auditId ?? null;
    monitoring.monitoringPlan = monitoringSubscription.productType;

    const savedAudit = await saveAuditRun({
      input,
      snapshot,
      result: {
        ...result,
        monitoring,
      },
      generatedBy: aiResult ? "openai" : "template",
      subscriptionId,
      scanType: "recurring",
      monitoringPlan: monitoringSubscription.productType,
      previousAuditId: previousAudit?.auditId ?? null,
      monitoring,
    });

    await markRecurringScanComplete({
      subscriptionId,
      auditId: savedAudit.auditId,
      stripeStatus: stripeSubscription.status,
      lastScanAt: savedAudit.createdAt,
      nextScanAt: getNextScanAt(monitoringSubscription.productType),
    });

    console.info("[dineintel] recurring scan completed", {
      subscriptionId,
      auditId: savedAudit.auditId,
      generatedBy: aiResult ? "openai" : "template",
    });

    return { processed: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Recurring scan failed.";
    await markRecurringScanFailed({
      subscriptionId,
      error: message,
    });

    console.error("[dineintel] recurring scan failed", {
      subscriptionId,
      error: message,
    });

    return { processed: false, reason: message };
  }
}

async function handleCron(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dueSubscriptions = await listDueRecurringSubscriptions(20);
  const results = [];

  for (const subscription of dueSubscriptions) {
    // Keep scans sequential to avoid rate spikes and preserve per-restaurant logs.
    const result = await processRecurringSubscription(subscription.subscriptionId);
    results.push({
      subscriptionId: subscription.subscriptionId,
      ...result,
    });
  }

  return NextResponse.json({
    ok: true,
    processed: results.filter((item) => item.processed).length,
    skipped: results.length - results.filter((item) => item.processed).length,
    results,
  });
}

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}
