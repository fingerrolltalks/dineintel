import { CheckCircle2 } from "lucide-react";
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
  const isReportPurchase = params.plan === "report";

  return (
    <main className="relative min-h-screen overflow-x-clip px-4 py-8 text-white antialiased sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-3xl items-center justify-center">
        <section className="glass w-full rounded-[2rem] p-6 text-center sm:p-8">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-lime/10 text-lime ring-1 ring-lime/20">
            <CheckCircle2 size={34} />
          </div>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-lime">Purchase Complete</p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
            Full Growth Plan Unlocked
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
            {isReportPurchase
              ? "Your AI-generated growth snapshots and recommendations are unlocked and ready to view."
              : "Your purchase is complete and your DineIntel workspace is ready."}
          </p>
          <div className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full border border-lime/20 bg-lime/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-lime">
            <CheckCircle2 size={14} />
            Full Growth Plan Unlocked
          </div>
          <p className="mt-5 text-sm text-white/58">
            Support email:{" "}
            <a href="mailto:boxyagent1@gmail.com" className="text-lime transition hover:text-white">
              boxyagent1@gmail.com
            </a>
          </p>
          <SuccessActions isReportPurchase={isReportPurchase} sessionId={params.session_id ?? null} />
        </section>
      </div>
    </main>
  );
}
