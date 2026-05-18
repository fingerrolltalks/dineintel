import type { ReactNode } from "react";

export function LegalPageShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-x-clip px-4 py-8 text-white antialiased sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <section className="glass rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-lime">{eyebrow}</p>
          <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 sm:text-base">{intro}</p>
          <div className="mt-8 space-y-6 text-sm leading-7 text-white/72 sm:text-base">{children}</div>
        </section>
      </div>
    </main>
  );
}
