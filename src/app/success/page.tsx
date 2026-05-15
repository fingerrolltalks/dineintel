import { CheckCircle2 } from "lucide-react";
import SuccessActions from "./success-actions";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams?: Promise<{
    plan?: string;
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
          <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-lime">Payment complete</p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">Payment confirmed. Your DineIntel growth plan is ready.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
            {isReportPurchase
              ? "Your instant full report unlock is ready right now."
              : "You can return to the scanner or keep using the report workflow anytime."}
          </p>
          <SuccessActions isReportPurchase={isReportPurchase} />
        </section>
      </div>
    </main>
  );
}
