"use client";

import type { ReactNode } from "react";
import { CheckCircle2, Clock3, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type CheckoutPlan = "report" | "starter" | "pro";

type PostPurchaseStatus = {
  found: boolean;
  purchase: null | {
    productType: CheckoutPlan | string | null;
    productName: string | null;
    subscriptionId: string | null;
    amountPaid: number;
    currency: string | null;
    paymentStatus: string | null;
    sourceEvent: string;
  };
  monitoring: null | {
    active: boolean;
    intervalDays: number | null;
    nextScanAt: string | null;
    lastScanAt: string | null;
    lastAttemptAt: string | null;
    scanCount: number;
    retryCount: number;
    stripeStatus: string | null;
    lastError: string | null;
    storedInDb: boolean;
  };
  error?: string;
};

const planCopy = {
  report: {
    title: "Purchase successful",
    status: "Full report unlocked",
    next: "Open the homepage to view your report and use the unlock on this device anytime.",
    included: ["AI growth snapshots", "Priority fixes", "Conversion leaks", "Recommended next actions"],
    frequency: "Instant access",
  },
  starter: {
    title: "Monitoring activated",
    status: "Starter monitoring is live",
    next: "Your subscription is stored in DineLeak's database and your next scan is queued automatically.",
    included: ["Website scans", "Google visibility checks", "Review sentiment", "Mobile insights"],
    frequency: "Every 30 days",
  },
  pro: {
    title: "Monitoring activated",
    status: "Pro monitoring is live",
    next: "Your subscription is stored in DineLeak's database and your next scan is queued automatically.",
    included: ["Everything in Starter", "Competitor checks", "Priority alerts", "Deeper recommendations"],
    frequency: "Every 7 days",
  },
} as const;

export function PostPurchaseActivation({
  planId,
  sessionId,
}: {
  planId: CheckoutPlan;
  sessionId: string | null;
}) {
  const [status, setStatus] = useState<PostPurchaseStatus | null>(null);
  const [loading, setLoading] = useState(Boolean(sessionId));

  const plan = useMemo(() => planCopy[planId], [planId]);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function poll() {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
          const response = await fetch("/api/post-purchase-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
            signal: controller.signal,
          });

          const data = (await response.json()) as PostPurchaseStatus;
          if (cancelled) return;

          if (response.ok && data.found) {
            setStatus(data);
            setLoading(false);
            return;
          }
        } catch {
          if (cancelled) return;
        }

        await new Promise((resolve) => window.setTimeout(resolve, 1500));
      }

      if (!cancelled) {
        setLoading(false);
      }
    }

    void poll();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [sessionId]);

  const resolvedStatus =
    status?.purchase?.productType && status.purchase.productType in planCopy
      ? planCopy[status.purchase.productType as CheckoutPlan]
      : plan;
  const isMonitoring = planId === "starter" || planId === "pro";
  const monitoring = status?.monitoring;

  return (
    <section className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-5 text-left sm:p-6">
      <div className="flex items-center gap-3">
        <div className="grid size-12 place-items-center rounded-2xl bg-lime/10 text-lime ring-1 ring-lime/20">
          {loading ? <Loader2 size={22} className="animate-spin" /> : <CheckCircle2 size={22} />}
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-lime">{loading ? "Activating" : "Activation confirmed"}</p>
          <h2 className="mt-1 text-2xl font-black leading-tight text-white">{resolvedStatus.title}</h2>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-lime/15 bg-lime/[0.06] p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-lime">{loading ? "Waiting for DB sync" : resolvedStatus.status}</p>
        <p className="mt-2 text-sm leading-7 text-white/78">
          {loading
            ? "Stripe payment is complete. We’re confirming the purchase record and monitoring record now."
            : isMonitoring
              ? monitoring?.active
                ? "Monitoring is active and the subscription record is stored in DineLeak’s database."
                : "Payment is complete and your monitoring record is syncing now."
              : "Your report unlock is active and ready to view."}
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <InfoTile label="What’s included" value={resolvedStatus.included.join(" • ")} />
        <InfoTile label="Monitoring frequency" value={resolvedStatus.frequency} />
      </div>

      {isMonitoring ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <InfoTile
            label="Next scan"
            value={monitoring?.nextScanAt ? new Date(monitoring.nextScanAt).toLocaleString() : loading ? "Syncing activation..." : "Queued automatically"}
            icon={<Clock3 size={14} />}
          />
          <InfoTile
            label="Database state"
            value={monitoring?.storedInDb ? "Stored in DineLeak database" : "Syncing from Stripe webhook"}
            icon={<ShieldCheck size={14} />}
          />
        </div>
      ) : null}

      <p className="mt-5 text-sm leading-7 text-white/68">
        {resolvedStatus.next}
      </p>

      <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-white/42">
        Support: <a href="mailto:dineleak@gmail.com" className="text-lime transition hover:text-white">dineleak@gmail.com</a>
      </p>
    </section>
  );
}

function InfoTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/22 p-4">
      <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-white/82">{value}</p>
    </div>
  );
}
