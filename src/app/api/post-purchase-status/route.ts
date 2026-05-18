import { NextResponse } from "next/server";
import { findRecurringSubscription } from "@/lib/monitoring-storage";
import { findPurchaseBySessionId } from "@/lib/stripe-purchase-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { sessionId?: string };
    const sessionId = body.sessionId?.trim();

    if (!sessionId) {
      return NextResponse.json({ found: false, error: "Missing sessionId." }, { status: 400 });
    }

    const purchase = await findPurchaseBySessionId(sessionId);
    if (!purchase.found || !purchase.record) {
      return NextResponse.json({
        found: false,
        purchase: null,
        monitoring: null,
      });
    }

    const isMonitoringPlan = purchase.record.productType === "starter" || purchase.record.productType === "pro";
    const monitoring = isMonitoringPlan && purchase.record.subscriptionId ? await findRecurringSubscription(purchase.record.subscriptionId) : null;

    return NextResponse.json({
      found: true,
      purchase: purchase.record,
      monitoring: monitoring
        ? {
            active: monitoring.active,
            intervalDays: monitoring.intervalDays,
            nextScanAt: monitoring.nextScanAt,
            lastScanAt: monitoring.lastScanAt,
            lastAttemptAt: monitoring.lastAttemptAt,
            scanCount: monitoring.scanCount,
            retryCount: monitoring.retryCount,
            stripeStatus: monitoring.stripeStatus,
            lastError: monitoring.lastError,
            storedInDb: true,
          }
        : {
            active: isMonitoringPlan,
            intervalDays: purchase.record.productType === "pro" ? 7 : purchase.record.productType === "starter" ? 30 : null,
            nextScanAt: null,
            lastScanAt: null,
            lastAttemptAt: null,
            scanCount: 0,
            retryCount: 0,
            stripeStatus: purchase.record.paymentStatus,
            lastError: null,
            storedInDb: false,
          },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to check purchase status.";
    return NextResponse.json({ found: false, error: message }, { status: 500 });
  }
}
