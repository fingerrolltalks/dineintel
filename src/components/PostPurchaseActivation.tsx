"use client";

import type { ReactNode } from "react";
import { CheckCircle2, Clock3, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { isReportUnlocked, setReportUnlocked } from "@/lib/report-session";

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
    title: "Purchase verified",
    status: "Full Growth Report Unlocked",
    next: "Purchase verified. Your report is unlocked below on this device.",
    included: ["AI revenue audit report", "Revenue leakage dashboard", "Competitor benchmark", "30-day action plan"],
    frequency: "Full Growth Report",
  },
  starter: {
    title: "Monitoring activated",
    status: "Monthly monitoring is live",
    next: "Monitoring is active. View your saved reports on the reports page. Use the same email from checkout.",
    included: ["Monthly AI scans", "Saved report history", "Website + reputation tracking", "Downloadable reports"],
    frequency: "Every 30 days",
  },
  pro: {
    title: "Monitoring activated",
    status: "Recurring monitoring is live",
    next: "Monitoring is active. View your saved reports on the reports page. Use the same email from checkout.",
    included: ["Monthly AI scans", "Saved report history", "Website + reputation tracking", "Downloadable reports"],
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
  const [failed, setFailed] = useState(false);
  const [hasLocalUnlock, setHasLocalUnlock] = useState(() => isReportUnlocked());

  const plan = useMemo(() => planCopy[planId], [planId]);
  const reportUnlocked = planId === "report" && (hasLocalUnlock || Boolean(status?.purchase));
  const showFailure = failed && !reportUnlocked;

  useEffect(() => {
    if (planId !== "report") return;

    const syncUnlockState = () => {
      const unlocked = isReportUnlocked();
      setHasLocalUnlock(unlocked);
      if (unlocked) {
        setFailed(false);
      }
    };

    syncUnlockState();
    window.addEventListener("dineleak-report-unlock", syncUnlockState);
    window.addEventListener("storage", syncUnlockState);

    return () => {
      window.removeEventListener("dineleak-report-unlock", syncUnlockState);
      window.removeEventListener("storage", syncUnlockState);
    };
  }, [planId]);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function poll() {
      for (let attempt = 0; attempt < 24; attempt += 1) {
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
            if (planId === "report" && sessionId) {
              setReportUnlocked(true, sessionId);
              setHasLocalUnlock(true);
            }
            setFailed(false);
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
        if (planId === "report" && isReportUnlocked()) {
          setHasLocalUnlock(true);
          setFailed(false);
          return;
        }
        setFailed(true);
      }
    }

    void poll();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [planId, sessionId]);

  const resolvedStatus =
    status?.purchase?.productType && status.purchase.productType in planCopy
      ? planCopy[status.purchase.productType as CheckoutPlan]
      : plan;
  const isMonitoring = planId === "starter" || planId === "pro";
  const monitoring = status?.monitoring;
  const errorMessage = "Payment received, but we could not unlock your access yet. Please contact support at support.omnirise@gmail.com.";
  const activationMessage =
    planId === "report"
      ? reportUnlocked
        ? "Your Premium AI Growth Report is unlocked."
        : "Confirming your purchase… this can take a few seconds."
      : failed && !loading
        ? errorMessage
        : loading
          ? "Confirming your purchase… this can take a few seconds."
          : isMonitoring
            ? monitoring?.active
              ? "Monitoring is active and the subscription record is stored in DineLeak’s database."
              : "Payment is complete and your monitoring record is syncing now."
            : "Your Premium AI Growth Report is ready.";

  return (
    <section className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-5 text-left sm:p-6">
      <div className="flex items-center gap-3">
        <div className="grid size-12 place-items-center rounded-2xl bg-lime/10 text-lime ring-1 ring-lime/20">
          {loading ? <Loader2 size={22} className="animate-spin" /> : <CheckCircle2 size={22} />}
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-lime">{loading ? "Confirming" : "Activation confirmed"}</p>
          <h2 className="mt-1 text-2xl font-black leading-tight text-white">{reportUnlocked ? "Purchase verified" : resolvedStatus.title}</h2>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-lime/15 bg-lime/[0.06] p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-lime">{loading ? "Waiting for DB sync" : showFailure ? "Verification pending" : resolvedStatus.status}</p>
          <p className="mt-2 text-sm leading-7 text-white/78">
            {showFailure
              ? errorMessage
              : activationMessage}
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
        Support: <a href="mailto:support.omnirise@gmail.com" className="text-lime transition hover:text-white">support.omnirise@gmail.com</a>
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
