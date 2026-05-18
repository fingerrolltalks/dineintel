import { NextResponse } from "next/server";
import { generateAudit, type AuditInput } from "@/lib/audit";
import { buildMonitoringSummary } from "@/lib/audit-history";
import { saveAuditRun, findLatestAuditRunByRestaurant, findLatestAuditRunBySubscriptionId } from "@/lib/audit-storage";
import { generateOpenAIAuditWithOptions } from "@/lib/openai-audit";
import { fetchGoogleAuditSignals } from "@/lib/google-signals";
import {
  findRecurringSubscription,
  listDueRecurringSubscriptions,
  markRecurringScanComplete,
  markRecurringScanFailed,
  setRecurringSubscriptionInactive,
} from "@/lib/monitoring-storage";
import { fetchWebsiteSnapshot } from "@/lib/website-snapshot";
import { getPlanPriceId, getStripe } from "@/lib/stripe";

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

  console.info("[dineleak] recurring scan started", {
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

      console.info("[dineleak] recurring scan skipped inactive subscription", {
        subscriptionId,
        stripeStatus: stripeSubscription.status,
      });

      return { processed: false, reason: "inactive-subscription" };
    }

    const expectedPriceId = getPlanPriceId(monitoringSubscription.productType).priceId;
    const activePriceIds = stripeSubscription.items.data
      .map((item) => item.price?.id ?? null)
      .filter((priceId): priceId is string => Boolean(priceId));

    if (!activePriceIds.includes(expectedPriceId)) {
      await setRecurringSubscriptionInactive({
        subscriptionId,
        stripeStatus: stripeSubscription.status,
      });

      console.error("[dineleak] recurring scan price mismatch", {
        subscriptionId,
        productType: monitoringSubscription.productType,
        expectedPriceId,
        activePriceIds,
      });

      return { processed: false, reason: "price-mismatch" };
    }

    const input = buildInputFromSubscription(monitoringSubscription);
    if (!input) {
      throw new Error("Missing restaurant details for recurring scan.");
    }

    const previousAudit =
      (await findLatestAuditRunBySubscriptionId(subscriptionId)) ??
      (await findLatestAuditRunByRestaurant(input.restaurant, input.website));

    const [snapshot, googleSignals] = await Promise.all([
      fetchWebsiteSnapshot(input.website),
      fetchGoogleAuditSignals(input),
    ]);
    const enrichedSnapshot = {
      ...snapshot,
      googleSignals,
    };
    const aiResult = await generateOpenAIAuditWithOptions(input, enrichedSnapshot, {
      previousAudit: previousAudit?.result ?? null,
      monitoringPlan: monitoringSubscription.productType,
      retries: 1,
      googleSignals,
    });
    const result = aiResult ?? generateAudit(input);
    const monitoring = buildMonitoringSummary(previousAudit?.result ?? null, result);
    monitoring.previousAuditId = previousAudit?.auditId ?? null;
    monitoring.monitoringPlan = monitoringSubscription.productType;

    const savedAudit = await saveAuditRun({
      input,
      snapshot: enrichedSnapshot,
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

    console.info("[dineleak] recurring scan completed", {
      subscriptionId,
      auditId: savedAudit.auditId,
      generatedBy: aiResult ? "openai" : "template",
      nextScanAt: getNextScanAt(monitoringSubscription.productType),
    });

    return { processed: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Recurring scan failed.";
    await markRecurringScanFailed({
      subscriptionId,
      error: message,
    });

    console.error("[dineleak] recurring scan failed", {
      subscriptionId,
      error: message,
    });

    return { processed: false, reason: message };
  }
}

async function handleCron(request: Request) {
  if (!isAuthorized(request)) {
    console.warn("[dineleak] recurring monitor unauthorized", {
      hasCronSecret: Boolean(process.env.CRON_SECRET?.trim()),
      deploymentEnv: process.env.VERCEL_ENV ?? "unknown",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dueSubscriptions = await listDueRecurringSubscriptions(20);
    console.info("[dineleak] recurring monitor run", {
      dueSubscriptions: dueSubscriptions.length,
      deploymentEnv: process.env.VERCEL_ENV ?? "unknown",
    });
    const results = [];

    for (const subscription of dueSubscriptions) {
      // Keep scans sequential to avoid rate spikes and preserve per-restaurant logs.
      const result = await processRecurringSubscription(subscription.subscriptionId);
      results.push({
        subscriptionId: subscription.subscriptionId,
        ...result,
      });
    }

    const processed = results.filter((item) => item.processed).length;
    const skipped = results.length - processed;
    console.info("[dineleak] recurring monitor finished", {
      dueSubscriptions: dueSubscriptions.length,
      processed,
      skipped,
    });

    return NextResponse.json({
      ok: true,
      processed,
      skipped,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Recurring monitor failed.";
    console.error("[dineleak] recurring monitor crashed", {
      error: message,
    });
    return NextResponse.json({ error: "Recurring monitor failed." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}
