"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { trackGaEvent } from "@/lib/analytics";
import { setReportUnlocked } from "@/lib/report-session";

export default function SuccessActions({
  isReportPurchase,
  sessionId,
}: {
  isReportPurchase: boolean;
  sessionId: string | null;
  }) {
  const router = useRouter();
  const hasTrackedPurchase = useRef(false);

  useEffect(() => {
    if (hasTrackedPurchase.current || !sessionId) return;
    hasTrackedPurchase.current = true;
    trackGaEvent("purchase_completed", {
      plan: isReportPurchase ? "report" : "subscription",
      session_id: sessionId,
    });
  }, [isReportPurchase, sessionId]);

  function viewReport() {
    setReportUnlocked(isReportPurchase);
    router.push(isReportPurchase ? `/?report=full${sessionId ? `&session_id=${encodeURIComponent(sessionId)}` : ""}` : "/");
  }

  return (
    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
      <button
        onClick={viewReport}
        className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#D7FF2F,#A7FF00)] px-5 py-4 text-sm font-black uppercase text-ink shadow-[0_0_42px_rgba(198,255,0,.28)] transition hover:-translate-y-0.5"
      >
        {isReportPurchase ? "Open Report" : "Go to homepage"}
        <ArrowRight size={17} className="transition group-hover:translate-x-1" />
      </button>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4 text-sm font-black uppercase text-white/80 transition hover:border-lime/40 hover:bg-lime/[0.06] hover:text-white"
      >
        Back to homepage
      </Link>
    </div>
  );
}
