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
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
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

  function submitAudit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStep(0);
    setPhase("scan");
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-5 text-white sm:px-6 lg:px-8">
      <AmbientFood />
      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between py-3">
        <div className="flex items-center gap-3.5">
          <div className="grid size-11 place-items-center rounded-2xl bg-lime text-ink shadow-glow transition duration-300 hover:rotate-[-4deg] hover:scale-105">
            <ChefHat size={23} />
          </div>
          <span className="text-2xl font-black tracking-[-0.04em]">DineIntel</span>
        </div>
        <a href="#audit" className="rounded-full border border-white/15 bg-white/[0.035] px-4 py-2 text-sm font-bold text-white/80 transition hover:border-lime/60 hover:bg-lime/10 hover:text-white">
          Scan now
        </a>
      </nav>

      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-9 pb-14 pt-10 sm:pt-14 lg:grid-cols-[1.02fr_.98fr] lg:pb-20 lg:pt-20">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-lime/20 bg-lime/[0.06] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-lime">
            <span className="size-2 rounded-full bg-lime shadow-glow" />
            Free 60-second growth scan
          </div>
          <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.058em] text-white sm:text-6xl lg:text-7xl">
            Find what’s quietly costing your restaurant customers.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/68 sm:text-lg sm:leading-8">
            DineIntel turns your public web presence into a sharp growth report: what guests see, where they hesitate, and which fixes can recover missed revenue fastest.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a href="#audit" className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-lime px-5 py-4 font-black text-ink shadow-glow transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_55px_rgba(198,255,0,.32)]">
              Run free audit
              <ArrowRight className="transition group-hover:translate-x-1" size={19} />
            </a>
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4 text-sm leading-6 text-white/62">
              No login. No card. Report first.
            </div>
          </div>
          <div className="mt-8 grid gap-3 text-sm text-white/70 sm:grid-cols-3">
            {["Visibility leaks", "Review trust gaps", "Ordering friction"].map((item) => (
              <span key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:-translate-y-0.5 hover:border-lime/30 hover:bg-lime/[0.05]">
                {item}
              </span>
            ))}
          </div>
          <div className="mt-6 max-w-xl rounded-3xl border border-gold/15 bg-gold/[0.04] p-4 text-sm leading-6 text-white/70">
            <span className="font-black text-gold">Example insight:</span> Your menu may be hard to find on mobile, causing guests to leave before ordering.
          </div>
        </motion.div>

        <section id="audit" className="glass relative overflow-hidden rounded-[2rem] p-6 ring-1 ring-lime/5 transition duration-500 hover:ring-lime/20 sm:p-8">
          <AnimatePresence mode="wait">
            {phase === "form" && (
              <motion.form
                key="form"
                onSubmit={submitAudit}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-5"
              >
                <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-lime">Instant audit</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">Find the leaks guests notice first</h2>
                  <p className="mt-2 text-sm leading-6 text-white/58">Enter the public links customers see before they decide where to eat, order, or book.</p>
                </div>
                <Input label="Restaurant Name" value={form.restaurant} onChange={(restaurant) => setForm({ ...form, restaurant })} placeholder="Marlow’s Bistro" required />
                <Input label="Website" value={form.website} onChange={(website) => setForm({ ...form, website })} placeholder="https://restaurant.com" required />
                <Input label="Instagram" value={form.instagram} onChange={(instagram) => setForm({ ...form, instagram })} placeholder="@restaurant" required />
                <Input label="TikTok optional" value={form.tiktok || ""} onChange={(tiktok) => setForm({ ...form, tiktok })} placeholder="@restaurant" />
                <button className="group mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-lime px-5 py-4 font-black text-ink shadow-glow transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_62px_rgba(198,255,0,.34)] focus:outline-none focus:ring-4 focus:ring-lime/25">
                  Reveal hidden growth leaks
                  <ArrowRight className="transition group-hover:translate-x-1" size={20} />
                </button>
                <p className="text-center text-xs leading-5 text-white/42">Private preview. No login, no subscription, no POS connection.</p>
              </motion.form>
            )}

            {phase === "scan" && (
              <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[560px] py-2">
                <div className="relative overflow-hidden rounded-[1.8rem] border border-lime/15 bg-black/24 p-5">
                  <div className="scan-grid absolute inset-0 opacity-35" />
                  <div className="relative mx-auto grid size-56 place-items-center rounded-full border border-lime/25 bg-lime/[0.03] shadow-glow sm:size-64">
                    <motion.div className="absolute h-px w-56 scan-line sm:w-64" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }} />
                    <motion.div className="absolute size-40 rounded-full border border-lime/15" animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.15, 0.45, 0.15] }} transition={{ repeat: Infinity, duration: 2.8 }} />
                    <div className="grid size-32 place-items-center rounded-full border border-white/10 bg-white/[0.05]">
                      <Sparkles className="text-lime" size={42} />
                    </div>
                    <div className="absolute bottom-8 rounded-full border border-gold/20 bg-gold/[0.08] px-3 py-1 text-xs font-black text-gold">
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
                      className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:border-lime/20 hover:bg-white/[0.06]"
                    >
                      <div>
                        <span className="text-sm font-bold">{item.label}</span>
                        <p className="mt-1 hidden text-xs text-white/42 sm:block">{item.detail}</p>
                      </div>
                      {index < step ? <CheckCircle2 className="text-lime" size={19} /> : <Clock3 className="text-gold" size={18} />}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {phase === "results" && result && <Results result={result} restart={() => setPhase("form")} />}
          </AnimatePresence>
        </section>
      </section>

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
      <span className="mb-2.5 block text-sm font-bold text-white/72">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-[1.05rem] text-white outline-none transition duration-300 placeholder:text-white/28 hover:border-white/18 focus:border-lime/70 focus:shadow-glow"
      />
    </label>
  );
}

function Results({ result, restart }: { result: AuditResult; restart: () => void }) {
  return (
    <motion.div key="results" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
      <div className="relative overflow-hidden rounded-[1.8rem] border border-lime/20 bg-[linear-gradient(145deg,rgba(198,255,0,.11),rgba(255,191,49,.055),rgba(255,255,255,.035))] p-5 shadow-glow">
        <GoldBurst />
        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-lime">Growth report unlocked</p>
          <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em]">{result.headline}</h2>
          <p className="mt-3 text-sm leading-6 text-white/62">The score matters less than the pattern: guests are likely hesitating at a few fixable moments before they order, reserve, or return.</p>
        </div>
        <div className="relative mt-6 grid items-center gap-5 sm:grid-cols-[auto_1fr]">
          <ScoreRing score={result.score} />
          <div className="grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/22 p-4">
              <div className="flex items-center gap-2 text-gold">
                <AlertTriangle size={18} />
                <span className="font-black">Revenue leak detected</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-white/58">Your fastest wins are CTA clarity, review trust, and repeat-guest capture.</p>
            </div>
            <div className="rounded-2xl border border-lime/15 bg-lime/[0.06] p-4">
              <div className="flex items-center gap-2 text-lime">
                <TrendingUp size={18} />
                <span className="font-black">Best next move</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-white/62">{result.opportunities[0].title}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[1.7rem] border border-gold/25 bg-[linear-gradient(145deg,rgba(255,191,49,.1),rgba(0,0,0,.22))] p-5 shadow-gold">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-gold">
              <Trophy size={20} />
              <h3 className="font-black">Top Growth Opportunities</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-white/55">Prioritized by likely customer impact, not vanity metrics.</p>
          </div>
        </div>
        <div className="space-y-3">
          {result.opportunities.map((item, index) => (
            <div key={item.title} className="group flex gap-3 rounded-2xl border border-white/8 bg-black/24 p-3 transition duration-300 hover:-translate-y-0.5 hover:border-gold/25 hover:bg-black/32">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gold text-sm font-black text-ink">{index + 1}</span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black leading-6 text-white">{item.title}</span>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${item.impact === "High" ? "bg-red-500/15 text-red-200" : "bg-gold/15 text-gold"}`}>
                    {item.impact} impact
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-white/58">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {result.categories.map((category) => {
          const Icon = categoryIcons[category.name as keyof typeof categoryIcons];
          return (
            <div key={category.name} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 transition duration-300 hover:-translate-y-0.5 hover:border-lime/25 hover:bg-white/[0.06]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black">
                  <Icon className="text-lime" size={18} />
                  {category.name}
                </div>
                <span className="text-xl font-black text-lime">{category.score}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div initial={{ width: 0 }} animate={{ width: `${category.score}%` }} transition={{ delay: 0.18, duration: 0.9, ease: "easeOut" }} className="h-full rounded-full bg-lime shadow-glow" />
              </div>
              <p className="mt-3 text-sm font-bold text-white">{category.issue}</p>
              <p className="mt-2 text-sm leading-6 text-white/56">{category.why}</p>
              <p className="mt-3 text-sm leading-6 text-white/78">Fix: {category.fix}</p>
            </div>
          );
        })}
      </div>
      <button onClick={restart} className="w-full rounded-2xl border border-white/15 bg-white/[0.035] px-5 py-4 font-bold text-white/80 transition duration-300 hover:-translate-y-0.5 hover:border-lime/50 hover:bg-lime/[0.06] hover:text-white focus:outline-none focus:ring-4 focus:ring-lime/20">
        Scan another restaurant
      </button>
    </motion.div>
  );
}

function ScoreRing({ score }: { score: number }) {
  return (
    <div className="relative mx-auto grid size-40 place-items-center sm:mx-0">
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
        <motion.div initial={{ scale: 0.55, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 140 }} className="text-6xl font-black tracking-[-0.08em] text-lime">
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
      <div className="pointer-events-none absolute -left-16 top-32 size-72 rounded-full bg-[radial-gradient(circle,#273015,transparent_67%)] blur-2xl" />
      <div className="ambient-drift pointer-events-none absolute right-0 top-24 hidden h-[520px] w-[420px] rounded-l-[4rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,191,49,.12),rgba(198,255,0,.07),rgba(255,255,255,.025))] blur-[1px] lg:block" />
      <div className="ambient-drift pointer-events-none absolute bottom-24 right-16 hidden size-40 rounded-full border border-gold/15 bg-gold/[0.025] shadow-[0_0_44px_rgba(255,191,49,.18)] lg:block" />
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
  return (
    <section className="relative z-10 mx-auto grid max-w-6xl gap-4 pb-10 sm:grid-cols-3">
      {[
        ["Visibility", "Find the local search gaps hiding demand."],
        ["Conversion", "Turn mobile visitors into orders faster."],
        ["Retention", "Capture guests before marketplaces do."],
      ].map(([title, body]) => (
        <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-lime/25 hover:bg-white/[0.055]">
          <h3 className="font-black">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/55">{body}</p>
        </div>
      ))}
    </section>
  );
}
