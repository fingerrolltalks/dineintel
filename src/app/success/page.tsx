import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { PostPurchaseActivation } from "@/components/PostPurchaseActivation";
import SuccessActions from "./success-actions";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams?: Promise<{
    plan?: string;
    session_id?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const planId = params.plan === "starter" || params.plan === "pro" ? params.plan : "report";
  const isReportPurchase = planId === "report";

  const includedItems =
    planId === "report"
      ? ["AI growth snapshots", "Priority fixes", "Conversion leaks", "Recommended next actions"]
      : planId === "pro"
        ? ["Everything in Starter", "Competitor checks", "Priority alerts", "Deeper recommendations"]
        : ["Website scans", "Google visibility checks", "Review sentiment", "Mobile insights"];

  const monitoringFrequency = planId === "pro" ? "Every 7 days" : planId === "starter" ? "Every 30 days" : "Instant access";

  return (
    <main className="relative min-h-screen overflow-x-clip px-4 py-8 text-white antialiased sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="glass rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-lime/10 text-lime ring-1 ring-lime/20 lg:mx-0">
                <CheckCircle2 size={34} />
              </div>
              <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-lime">
                {isReportPurchase ? "Purchase successful" : "Monitoring activated"}
              </p>
              <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                {isReportPurchase ? "Your full report is unlocked" : "Your subscription is live"}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/68 sm:text-base lg:mx-0">
                {isReportPurchase
                  ? "Your AI-generated growth snapshot is ready now. Open the homepage to view the unlocked report and keep the access on this device."
                  : "Your paid monitoring plan is active. DineLeak will keep scanning on the selected cadence and save new results as they arrive."}
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4 text-sm text-white/74 lg:min-w-[260px]">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-lime">What happens next</p>
              <ul className="mt-3 space-y-2 leading-6">
                <li>• {isReportPurchase ? "Your report opens from the homepage." : "Your monitoring record is stored in DineLeak’s database."}</li>
                <li>• {isReportPurchase ? "You can revisit the unlocked report anytime on this device." : `Scans run ${monitoringFrequency.toLowerCase()}.`}</li>
                <li>• {isReportPurchase ? "Support is available if anything looks off." : "New findings will appear after each scheduled scan."}</li>
              </ul>
            </div>
          </div>
        </section>

        <PostPurchaseActivation planId={planId} sessionId={params.session_id ?? null} />

        <section className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
          <div className="glass rounded-[2rem] p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-lime">Included</p>
            <h2 className="mt-3 text-2xl font-black text-white">
              {isReportPurchase ? "What the report includes" : "What the subscription includes"}
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {includedItems.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/76">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-[2rem] p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-lime">Details</p>
            <h2 className="mt-3 text-2xl font-black text-white">
              {isReportPurchase ? "Instant report access" : "Recurring monitoring schedule"}
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-white/72">
              <p>
                {isReportPurchase
                  ? "Paid digital reports are delivered instantly after checkout. Your unlock is tied to this purchase and can be reopened from the homepage."
                  : `Monitoring frequency: ${monitoringFrequency}. Reports and alerts are generated from available website data and connected sources.`}
              </p>
              <p>
                Where reports appear: {isReportPurchase ? "on the homepage immediately after checkout" : "inside your DineLeak monitoring history after each scan completes"}.
              </p>
              <p>
                Support email:{" "}
                <a href="mailto:dineleak@gmail.com" className="text-lime transition hover:text-white">
                  dineleak@gmail.com
                </a>
              </p>
            </div>
          </div>
        </section>

        <section className="glass rounded-[2rem] p-6 sm:p-8 text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-lime">Next step</p>
          <h2 className="mt-3 text-2xl font-black text-white">Head back to DineLeak</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/68">
            Open the homepage to continue using DineLeak. If you just bought a report, the unlock stays active on this device. If you bought monitoring, the subscription is already active and waiting for the next scan.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#D7FF2F,#A7FF00)] px-5 py-4 text-sm font-black uppercase text-ink shadow-[0_0_42px_rgba(198,255,0,.28)] transition hover:-translate-y-0.5"
            >
              Go to homepage
              <ArrowRight size={17} className="transition group-hover:translate-x-1" />
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4 text-sm font-black uppercase text-white/80 transition hover:border-lime/40 hover:bg-lime/[0.06] hover:text-white"
            >
              Need help?
            </Link>
          </div>
        </section>

        <SuccessActions isReportPurchase={isReportPurchase} sessionId={params.session_id ?? null} />
      </div>
    </main>
  );
}
