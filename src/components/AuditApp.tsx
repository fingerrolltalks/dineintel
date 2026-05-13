"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  Clock3,
  Flame,
  Globe2,
  MousePointerClick,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { generateAudit, type AuditInput, type AuditResult } from "@/lib/audit";

const scanSteps = [
  {
    label: "Analyzing local discoverability...",
    detail: "Google profile signals, hours, category fit, and nearby intent",
  },
  {
    label: "Reviewing customer sentiment...",
    detail: "Recent complaints, trust patterns, and response gaps",
  },
  {
    label: "Scanning mobile conversion flow...",
    detail: "Menu access, ordering friction, reservations, and CTA clarity",
  },
  {
    label: "Comparing nearby competitors...",
    detail: "Visibility pressure, social consistency, and brand memorability",
  },
  {
    label: "Prioritizing revenue leaks...",
    detail: "Ranking fixes by urgency, ease, and likely customer impact",
  },
];

const categoryIcons = {
  Visibility: Globe2,
  Conversion: MousePointerClick,
  Reputation: Star,
  Social: Flame,
  Retention: Users,
};

export default function AuditApp() {
  const [phase, setPhase] = useState<"form" | "scan" | "results">("form");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [form, setForm] = useState<AuditInput>({
    restaurant: "",
    website: "",
    instagram: "",
    tiktok: "",
  });

  useEffect(() => {
    if (phase !== "scan") return;

    const timers = scanSteps.map((_, index) =>
      window.setTimeout(() => setStep(index), index * 720),
    );
    const finish = window.setTimeout(() => {
      setResult(generateAudit(form));
      setPhase("results");
    }, scanSteps.length * 720 + 300);

    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(finish);
    };
  }, [form, phase]);

  useEffect(() => {
    if (phase !== "results") return;

    const scrollTimer = window.setTimeout(() => {
      document.getElementById("report-results")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);

    return () => window.clearTimeout(scrollTimer);
  }, [phase]);

  function submitAudit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStep(0);
    setPhase("scan");
  }

  return (
    <main className="relative min-h-screen overflow-x-clip px-4 py-5 text-white antialiased sm:px-6 lg:px-8">
      <AmbientFood />
      <nav className="relative z-10 mx-auto flex w-full max-w-[1180px] items-center justify-between py-3">
        <div className="flex items-center gap-3.5">
          <div className="grid size-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,#D7FF2F,#9DFF00)] text-ink shadow-[0_0_32px_rgba(198,255,0,.42)] transition duration-300 hover:rotate-[-4deg] hover:scale-105">
            <ChefHat size={23} />
          </div>
          <span className="text-2xl font-black tracking-[-0.04em]">DineIntel</span>
        </div>
        <a href="#audit" className="rounded-full border border-lime/25 bg-white/[0.04] px-5 py-2.5 text-sm font-black text-white/86 shadow-[inset_0_1px_0_rgba(255,255,255,.07)] transition hover:border-lime/65 hover:bg-lime/10 hover:text-white">
          Scan now
        </a>
      </nav>

      <section className="relative z-10 mx-auto grid w-full max-w-[1180px] min-w-0 items-start gap-8 pb-12 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,.92fr)_minmax(0,1fr)] lg:gap-7 lg:pb-16 lg:pt-14 xl:grid-cols-[minmax(0,.88fr)_minmax(0,.98fr)]">
        <motion.div className="min-w-0 lg:pt-8" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-lime/30 bg-lime/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.11em] text-lime shadow-[0_0_28px_rgba(198,255,0,.12)]">
            <span className="size-2 rounded-full bg-lime shadow-[0_0_16px_rgba(198,255,0,.9)]" />
            Free 60-second growth scan
          </div>
          <h1 className="max-w-5xl text-[3.15rem] font-extrabold uppercase leading-[0.94] tracking-[-0.062em] text-white sm:text-[4.75rem] lg:text-[4.05rem] xl:text-[4.95rem]">
            Your restaurant is
            <span className="neon-headline block">leaking revenue.</span>
          </h1>
          <p className="mt-6 max-w-[41rem] text-base leading-7 text-white/74 sm:text-lg sm:leading-8">
            DineIntel scans your restaurant’s public presence to identify hidden customer friction, trust gaps, and lost revenue opportunities before guests choose somewhere else.
          </p>
          <div className="mt-7 grid min-w-0 gap-3 sm:grid-cols-3">
            {[
              ["Find hidden leaks", "Before they cost you"],
              ["See what guests notice", "First"],
              ["Fix issues that", "Recover revenue"],
            ].map(([title, body]) => (
              <div key={title} className="group min-w-0 rounded-2xl border border-white/[0.075] bg-white/[0.035] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.05)] transition hover:-translate-y-0.5 hover:border-lime/30 hover:bg-lime/[0.05]">
                <div className="mb-2 grid size-8 place-items-center rounded-xl bg-lime/10 text-lime">
                  <Zap size={16} />
                </div>
                <p className="text-xs font-black leading-5 text-white">{title}</p>
                <p className="text-xs leading-5 text-white/52">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#audit" className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#D7FF2F,#A7FF00)] px-7 py-5 text-base font-black uppercase tracking-[-0.015em] text-ink shadow-[0_0_48px_rgba(198,255,0,.34)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_0_72px_rgba(198,255,0,.46)]">
              Scan my restaurant
              <ArrowRight className="transition group-hover:translate-x-1.5" size={21} />
            </a>
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4 text-sm leading-6 text-white/64">
              No login. No card. 100% free.
            </div>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-3 text-sm text-white/70">
            <div className="flex -space-x-2">
              {["A", "B", "C"].map((item) => (
                <span key={item} className="grid size-8 place-items-center rounded-full border border-black bg-gradient-to-br from-white to-lime/50 text-xs font-black text-ink">
                  {item}
                </span>
              ))}
            </div>
            <span className="text-lime">★★★★★</span>
            <span>2,341 restaurants scanned this week</span>
          </div>
          <div className="mt-6 max-w-xl rounded-3xl border border-lime/15 bg-lime/[0.035] p-4 text-sm leading-6 text-white/70 shadow-[0_0_28px_rgba(198,255,0,.07)]">
            <span className="font-black text-lime">Example insight:</span> Your menu may be hard to find on mobile, causing guests to leave before ordering.
          </div>
        </motion.div>

        <div className="grid w-full min-w-0 max-w-[560px] justify-self-center gap-5 lg:justify-self-end">
          <RevenueLeakCard />
          {phase !== "results" && (
            <section id="audit" className="glass relative w-full min-w-0 max-w-full overflow-hidden rounded-[1.65rem] p-5 ring-1 ring-lime/12 transition duration-500 hover:-translate-y-1 hover:ring-lime/28 sm:p-6">
              <AnimatePresence mode="wait">
                {phase === "form" && (
                  <motion.form
                    key="form"
                    onSubmit={submitAudit}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="min-w-0 space-y-5"
                  >
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-lime">Instant audit</p>
                      <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">See what guests notice first.</h2>
                      <p className="mt-3 text-sm leading-6 text-white/62">Enter your details and we’ll scan your public links to find hidden growth leaks in 60 seconds.</p>
                    </div>
                    <Input label="Restaurant Name" value={form.restaurant} onChange={(restaurant) => setForm({ ...form, restaurant })} placeholder="Marlow’s Bistro" required />
                    <Input label="Website" value={form.website} onChange={(website) => setForm({ ...form, website })} placeholder="https://restaurant.com" required />
                    <Input label="Instagram" value={form.instagram} onChange={(instagram) => setForm({ ...form, instagram })} placeholder="@restaurant" required />
                    <Input label="TikTok optional" value={form.tiktok || ""} onChange={(tiktok) => setForm({ ...form, tiktok })} placeholder="@restaurant" />
                    <button className="group mt-3 flex w-full items-center justify-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#D7FF2F,#A7FF00)] px-5 py-5 text-base font-black uppercase text-ink shadow-[0_0_46px_rgba(198,255,0,.34)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_0_72px_rgba(198,255,0,.46)] focus:outline-none focus:ring-4 focus:ring-lime/25">
                      Reveal my leaks
                      <ArrowRight className="transition group-hover:translate-x-1.5" size={21} />
                    </button>
                    <p className="text-center text-xs leading-5 text-white/44">Private preview. No login. No subscription.</p>
                  </motion.form>
                )}

                {phase === "scan" && (
                  <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[520px] min-w-0 py-2">
                    <div className="relative overflow-hidden rounded-[1.8rem] border border-lime/15 bg-black/24 p-5">
                      <div className="scan-grid absolute inset-0 opacity-35" />
                      <div className="relative mx-auto grid size-56 place-items-center rounded-full border border-lime/25 bg-lime/[0.03] shadow-glow sm:size-64">
                        <motion.div className="absolute h-px w-56 scan-line sm:w-64" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }} />
                        <motion.div className="absolute size-40 rounded-full border border-lime/15" animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.15, 0.45, 0.15] }} transition={{ repeat: Infinity, duration: 2.8 }} />
                        <div className="grid size-32 place-items-center rounded-full border border-white/10 bg-white/[0.05]">
                          <Sparkles className="text-lime" size={42} />
                        </div>
                        <div className="absolute bottom-8 rounded-full border border-lime/20 bg-lime/[0.08] px-3 py-1 text-xs font-black text-lime">
                          {Math.min(96, 18 + step * 19)}% analyzed
                        </div>
                      </div>
                      <div className="relative mt-5 text-center">
                        <motion.p key={scanSteps[step].label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xl font-black tracking-tight">
                          {scanSteps[step].label}
                        </motion.p>
                        <p className="mt-2 text-sm leading-6 text-white/55">{scanSteps[step].detail}</p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      {scanSteps.map((item, index) => (
                        <motion.div
                          key={item.label}
                          animate={{ opacity: index <= step ? 1 : 0.38, x: index === step ? 6 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="group flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:border-lime/20 hover:bg-white/[0.06]"
                        >
                          <div className="min-w-0">
                            <span className="text-sm font-bold">{item.label}</span>
                            <p className="mt-1 hidden text-xs text-white/42 sm:block">{item.detail}</p>
                          </div>
                          {index < step ? <CheckCircle2 className="text-lime" size={19} /> : <Clock3 className="text-lime" size={18} />}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}
        </div>
      </section>

      <AnimatePresence>
        {phase === "results" && result && <Results result={result} restart={() => setPhase("form")} />}
      </AnimatePresence>

      <TrustStrip />
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2.5 block text-xs font-black uppercase tracking-[0.04em] text-white/76">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-[1.05rem] text-white outline-none transition duration-300 placeholder:text-white/36 hover:border-lime/30 focus:border-lime/80 focus:shadow-[0_0_34px_rgba(198,255,0,.18)]"
      />
    </label>
  );
}

function ReportCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`glass min-w-0 rounded-[1.5rem] p-5 sm:p-6 lg:p-8 ${className}`}>
      {children}
    </div>
  );
}

function RevenueLeakCard() {
  const leaks = [
    ["Slow mobile experience", "-$1,246/mo"],
    ["Confusing menu layout", "-$876/mo"],
    ["Weak trust signals", "-$643/mo"],
  ];

  return (
    <motion.aside
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.7 }}
      className="glass relative w-full min-w-0 max-w-full overflow-hidden rounded-[1.65rem] border-lime/24 p-5 shadow-[0_0_48px_rgba(198,255,0,.11)]"
    >
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-lime/70 to-transparent" />
      <div className="scan-grid absolute inset-0 opacity-20" />
      <div className="relative">
        <p className="text-center text-xs font-black uppercase tracking-[0.14em] text-white/86">Revenue Leak Score</p>
        <div className="relative mx-auto mt-6 grid size-52 place-items-center">
          <div className="absolute inset-0 rounded-full bg-lime/10 blur-3xl" />
          <svg className="absolute inset-0 -rotate-[130deg]" viewBox="0 0 220 220" aria-hidden="true">
            <circle cx="110" cy="110" r="82" stroke="rgba(255,255,255,.10)" strokeWidth="18" fill="none" strokeLinecap="round" strokeDasharray="386 520" />
            <motion.circle
              cx="110"
              cy="110"
              r="82"
              stroke="#C6FF00"
              strokeWidth="18"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="196 520"
              initial={{ strokeDashoffset: 196 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </svg>
          <div className="text-center">
            <div className="text-6xl font-extrabold tracking-[-0.07em] text-white">37%</div>
            <div className="mt-1 text-sm font-black uppercase tracking-[0.075em] text-lime">Leak detected</div>
            <div className="mx-auto mt-3 w-fit rounded-full border border-red-400/25 bg-red-500/14 px-3 py-1 text-xs font-black text-red-300">High Impact</div>
          </div>
        </div>

        <div className="mt-7 border-t border-white/[0.075] pt-5">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-white/70">Top leaks found</p>
          <div className="space-y-3">
            {leaks.map(([label, loss]) => (
              <div key={label} className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-black/24 px-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-7 place-items-center rounded-lg bg-lime/12 text-lime">
                    <AlertTriangle size={14} />
                  </span>
                  <span className="min-w-0 text-sm font-bold text-white/86">{label}</span>
                </div>
                <span className="shrink-0 text-xs font-black text-red-300">{loss}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="group mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.075] bg-white/[0.03] px-5 py-4 text-sm font-black text-white transition hover:border-lime/35 hover:bg-lime/[0.07]">
          View full report
          <ArrowRight className="transition group-hover:translate-x-1" size={17} />
        </button>
      </div>
    </motion.aside>
  );
}

function Results({ result, restart }: { result: AuditResult; restart: () => void }) {
  return (
    <motion.section
      id="report-results"
      key="results"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      className="relative z-10 mx-auto w-full max-w-[1240px] scroll-mt-8 px-0 pb-12 pt-6 sm:pb-16 sm:pt-8"
    >
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-lime">Growth report unlocked</p>
          <h2 className="mt-3 max-w-4xl text-3xl font-black leading-[1.05] text-white sm:text-4xl lg:text-5xl">
            {result.headline}
          </h2>
        </div>
        <button onClick={restart} className="w-full rounded-2xl border border-white/15 bg-white/[0.035] px-5 py-4 font-bold text-white/80 transition duration-300 hover:-translate-y-0.5 hover:border-lime/50 hover:bg-lime/[0.06] hover:text-white focus:outline-none focus:ring-4 focus:ring-lime/20 sm:w-auto">
          Scan another restaurant
        </button>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,.86fr)_minmax(0,1.14fr)] lg:gap-8">
        <ReportCard className="relative overflow-hidden border-lime/18 bg-[linear-gradient(145deg,rgba(198,255,0,.11),rgba(183,255,0,.045),rgba(255,255,255,.03))] shadow-glow">
          <GoldBurst />
          <div className="relative flex min-w-0 flex-col items-center gap-5 text-center">
            <ScoreRing score={result.score} size="large" />
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/48">Growth score</p>
              <p className="mt-2 text-base leading-7 text-white/66">
                The score matters less than the pattern: guests are likely hesitating at a few fixable moments before they order, reserve, or return.
              </p>
            </div>
          </div>
        </ReportCard>

        <div className="grid min-w-0 gap-6">
          <ReportCard>
            <div className="flex min-w-0 items-start gap-3 text-gold">
              <AlertTriangle className="mt-1 shrink-0" size={22} />
              <div className="min-w-0">
                <h3 className="text-2xl font-black leading-tight text-white">Revenue leak detected</h3>
                <p className="mt-3 text-base leading-7 text-white/64">Your fastest wins are CTA clarity, review trust, and repeat-guest capture.</p>
              </div>
            </div>
          </ReportCard>
          <ReportCard className="border-lime/18 bg-lime/[0.045]">
            <div className="flex min-w-0 items-start gap-3 text-lime">
              <TrendingUp className="mt-1 shrink-0" size={22} />
              <div className="min-w-0">
                <h3 className="text-2xl font-black leading-tight text-white">Best next move</h3>
                <p className="mt-3 text-base leading-7 text-white/68">{result.opportunities[0].title}</p>
              </div>
            </div>
          </ReportCard>
        </div>
      </div>

      <ReportCard className="mt-6 border-gold/25 bg-[linear-gradient(145deg,rgba(255,191,49,.1),rgba(0,0,0,.22))] shadow-gold lg:mt-8">
        <div className="mb-5 flex min-w-0 items-start gap-3 text-gold">
          <Trophy className="mt-1 shrink-0" size={22} />
          <div className="min-w-0">
            <h3 className="text-2xl font-black leading-tight text-white">Top Growth Opportunities</h3>
            <p className="mt-2 text-base leading-7 text-white/58">Prioritized by likely customer impact, not vanity metrics.</p>
          </div>
        </div>
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          {result.opportunities.map((item, index) => (
            <div key={item.title} className="group flex min-w-0 gap-4 rounded-3xl border border-white/10 bg-black/24 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-gold/25 hover:bg-black/32 sm:p-5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold text-sm font-black text-ink">{index + 1}</span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="min-w-0 text-base font-black leading-6 text-white">{item.title}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${item.impact === "High" ? "bg-red-500/15 text-red-200" : "bg-gold/15 text-gold"}`}>
                    {item.impact} impact
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-white/62 sm:text-base sm:leading-7">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </ReportCard>

      <div className="mt-6 grid min-w-0 gap-5 sm:grid-cols-2 lg:mt-8 lg:grid-cols-3">
        {result.categories.map((category) => {
          const Icon = categoryIcons[category.name as keyof typeof categoryIcons];
          return (
            <ReportCard key={category.name} className="p-5 transition duration-300 hover:-translate-y-0.5 hover:border-lime/25 hover:bg-white/[0.06] sm:p-6">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2 font-black text-white">
                  <Icon className="shrink-0 text-lime" size={19} />
                  <span className="min-w-0 [overflow-wrap:anywhere]">{category.name}</span>
                </div>
                <span className="shrink-0 text-2xl font-black text-lime">{category.score}</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div initial={{ width: 0 }} animate={{ width: `${category.score}%` }} transition={{ delay: 0.18, duration: 0.9, ease: "easeOut" }} className="h-full rounded-full bg-lime shadow-glow" />
              </div>
              <p className="mt-4 text-base font-bold leading-6 text-white">{category.issue}</p>
              <p className="mt-2 text-sm leading-6 text-white/58">{category.why}</p>
              <p className="mt-4 text-sm leading-6 text-white/78">Fix: {category.fix}</p>
            </ReportCard>
          );
        })}
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 text-center sm:p-6 lg:mt-8">
        <p className="text-base font-bold leading-7 text-white/74">Report preview complete. The fastest path is fixing the top opportunity first, then using the score cards as your weekly growth checklist.</p>
        <button onClick={restart} className="mt-5 w-full rounded-2xl bg-[linear-gradient(135deg,#D7FF2F,#A7FF00)] px-5 py-4 font-black uppercase text-ink shadow-[0_0_42px_rgba(198,255,0,.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_62px_rgba(198,255,0,.4)] sm:w-auto">
          Scan another restaurant
        </button>
      </div>
    </motion.section>
  );
}

function ScoreRing({ score, size = "default" }: { score: number; size?: "default" | "large" }) {
  const ringSize = size === "large" ? "size-52 sm:size-60" : "size-40";
  const numberSize = size === "large" ? "text-7xl sm:text-8xl" : "text-6xl";

  return (
    <div className={`relative mx-auto grid ${ringSize} shrink-0 place-items-center`}>
      <div className="absolute inset-0 rounded-full bg-lime/10 blur-2xl" />
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 160 160" aria-hidden="true">
        <circle cx="80" cy="80" r="68" stroke="rgba(255,255,255,.12)" strokeWidth="12" fill="none" />
        <motion.circle
          cx="80"
          cy="80"
          r="68"
          stroke="#c6ff00"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="427"
          initial={{ strokeDashoffset: 427 }}
          animate={{ strokeDashoffset: 427 - (427 * score) / 100 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div className="text-center">
        <motion.div initial={{ scale: 0.55, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 140 }} className={`${numberSize} font-black text-lime`}>
          {score}
        </motion.div>
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/48">Growth Score</div>
      </div>
    </div>
  );
}

function AmbientFood() {
  return (
    <>
      <div className="noise-layer pointer-events-none absolute inset-0 opacity-[0.045]" />
      <div className="mesh-layer pointer-events-none absolute inset-0" />
      <div className="floor-grid pointer-events-none absolute inset-x-0 top-[24rem] hidden h-[28rem] lg:block" />
      <div className="pointer-events-none absolute -left-24 top-20 size-[34rem] rounded-full bg-[radial-gradient(circle,rgba(198,255,0,.12),transparent_68%)] blur-3xl" />
      <div className="ambient-drift pointer-events-none absolute right-0 top-6 hidden h-[620px] w-[560px] rounded-l-[5rem] border border-lime/5 bg-[linear-gradient(145deg,rgba(198,255,0,.095),rgba(183,255,0,.045),rgba(255,255,255,.014))] blur-[1px] lg:block" />
      <div className="beam-layer pointer-events-none absolute right-0 top-0 hidden h-[620px] w-[620px] lg:block" />
      <div className="ambient-drift pointer-events-none absolute bottom-20 right-12 hidden size-44 rounded-full border border-lime/15 bg-lime/[0.025] shadow-[0_0_46px_rgba(198,255,0,.22)] lg:block" />
    </>
  );
}

function GoldBurst() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {[...Array(12)].map((_, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, x: "50%", y: "60%", scale: 0 }}
          animate={{ opacity: [0, 1, 0], x: `${20 + index * 6}%`, y: `${8 + (index % 5) * 15}%`, scale: [0, 1, 0.4] }}
          transition={{ delay: index * 0.05, duration: 1.4 }}
          className="absolute size-2 rounded-full bg-gold"
        />
      ))}
    </div>
  );
}

function TrustStrip() {
  const cards = [
    { title: "Visibility", body: "Find the local search gaps hiding demand.", Icon: Globe2 },
    { title: "Conversion", body: "Turn mobile visitors into orders faster.", Icon: MousePointerClick },
    { title: "Retention", body: "Capture guests before marketplaces do.", Icon: Users },
  ];

  return (
    <section className="relative z-10 mx-auto grid w-full max-w-[1180px] gap-4 pb-10 sm:grid-cols-3">
      {cards.map(({ title, body, Icon }) => (
        <div key={title} className="group rounded-3xl border border-white/10 bg-[linear-gradient(145deg,rgba(14,19,32,.86),rgba(255,255,255,.035))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,.06)] transition duration-300 hover:-translate-y-1 hover:border-lime/35 hover:bg-lime/[0.055] hover:shadow-[0_0_42px_rgba(198,255,0,.12)]">
          <div className="mb-5 grid size-11 place-items-center rounded-2xl bg-lime/10 text-lime ring-1 ring-lime/20 transition group-hover:scale-105 group-hover:bg-lime group-hover:text-ink">
            <Icon size={21} />
          </div>
          <h3 className="text-xl font-black tracking-[-0.03em]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/55">{body}</p>
        </div>
      ))}
    </section>
  );
}
