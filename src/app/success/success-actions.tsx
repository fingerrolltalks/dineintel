"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { setReportUnlocked } from "@/lib/report-session";

export default function SuccessActions({ isReportPurchase }: { isReportPurchase: boolean }) {
  const router = useRouter();

  function viewReport() {
    setReportUnlocked(isReportPurchase);
    router.push(isReportPurchase ? "/?report=full" : "/");
  }

  return (
    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
      <button
        onClick={viewReport}
        className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#D7FF2F,#A7FF00)] px-5 py-4 text-sm font-black uppercase text-ink shadow-[0_0_42px_rgba(198,255,0,.28)] transition hover:-translate-y-0.5"
      >
        {isReportPurchase ? "View My Full Report" : "Return to DineIntel"}
        <ArrowRight size={17} className="transition group-hover:translate-x-1" />
      </button>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4 text-sm font-black uppercase text-white/80 transition hover:border-lime/40 hover:bg-lime/[0.06] hover:text-white"
      >
        Back to scanner
      </Link>
    </div>
  );
}
