import Link from "next/link";
import { ArrowRight, XCircle } from "lucide-react";

export default function CancelPage() {
  return (
    <main className="relative min-h-screen overflow-x-clip px-4 py-8 text-white antialiased sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-3xl items-center justify-center">
        <section className="glass w-full rounded-[2rem] p-6 text-center sm:p-8">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-500/10 text-red-200 ring-1 ring-red-400/20">
            <XCircle size={34} />
          </div>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-red-200">Checkout canceled</p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">Checkout canceled. You can return to your report anytime.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
            Jump back into DineLeak whenever you’re ready to continue.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/" className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#D7FF2F,#A7FF00)] px-5 py-4 text-sm font-black uppercase text-ink shadow-[0_0_42px_rgba(198,255,0,.28)] transition hover:-translate-y-0.5">
              Return to DineLeak
              <ArrowRight size={17} className="transition group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
