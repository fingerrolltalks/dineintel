"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  Clock3,
  CreditCard,
  Flame,
  Globe2,
  MousePointerClick,
  Loader2,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import type { FormEvent, HTMLAttributes, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { generateAudit, type AuditInput, type AuditResult } from "@/lib/audit";
import { isReportUnlocked, loadReportResult, saveReportResult, setReportUnlocked } from "@/lib/report-session";

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

const brandName = "DineLeak";
const mainCtaLabel = "Run Free Leak Scan";

const categoryIcons = {
  Visibility: Globe2,
  Conversion: MousePointerClick,
  Reputation: Star,
  Social: Flame,
  Retention: Users,
};

type PremiumSection = {
  title: string;
  teaser: string;
  finding: string;
  why: string;
  revenueImpact: string;
  action: string;
  priority: "High" | "Medium" | "Low";
  difficulty: "Easy" | "Medium" | "Hard";
  quickWin: string;
  longTerm: string;
};

const premiumSections: PremiumSection[] = [
  {
    title: "Homepage CTA Friction Detected",
    teaser: "The hero may be making guests work too hard before they see how to order.",
    finding:
      "Visitors likely understand the brand, but the next action is still a little buried on mobile. That creates extra hesitation at the exact moment they should convert.",
    why:
      "When guests pause to search for Menu, Order, or Reserve, some of them leave before they ever tap.",
    revenueImpact: "Estimated recovery: $700-$1,100/mo",
    action: "Move the primary CTA higher, repeat it after the trust proof, and make the mobile action row impossible to miss.",
    priority: "High",
    difficulty: "Easy",
    quickWin: "Repeat Menu / Order above the fold and near the first scroll break.",
    longTerm: "A/B test two hero layouts and track mobile tap-through rate weekly.",
  },
  {
    title: "Review Trust Signal Gap",
    teaser: "Guests may be reading recent complaints before they decide.",
    finding:
      "The paid report would likely surface repeated phrases around wait time, service speed, or order clarity. Those patterns usually influence whether a guest trusts the restaurant enough to commit.",
    why:
      "Fresh responses and visible follow-through help local ranking signals and reduce the risk of losing high-intent diners.",
    revenueImpact: "Estimated recovery: $500-$900/mo",
    action: "Reply to the newest negative reviews, acknowledge the issue directly, and show one visible fix in public responses.",
    priority: "High",
    difficulty: "Easy",
    quickWin: "Respond to the latest low-rated reviews with one clear fix.",
    longTerm: "Build a weekly review response process for service, timing, and order accuracy complaints.",
  },
  {
    title: "Google Visibility Losses",
    teaser: "Local search demand may be leaking before guests even hit the site.",
    finding:
      "The report would likely show profile gaps around hours, categories, photo freshness, and intent keywords that help Google decide whether to surface the restaurant.",
    why:
      "Small local SEO misses can quietly reduce calls, directions taps, and website visits without any obvious warning.",
    revenueImpact: "Estimated recovery: $600-$1,200/mo",
    action: "Tighten business hours, sharpen category and keyword coverage, and keep photos updated around current menu highlights.",
    priority: "High",
    difficulty: "Medium",
    quickWin: "Refresh hours, categories, and profile photos this week.",
    longTerm: "Monitor local profile completeness and visibility changes every week.",
  },
  {
    title: "Social Content Is Under-Selling The Food",
    teaser: "The feed may not be creating enough craving or recall.",
    finding:
      "Short-form clips, signature dishes, and clearer visit prompts often outperform generic brand posts. If those are missing, guests have less reason to remember or share the restaurant.",
    why:
      "Restaurants win attention when the food is instantly understandable and easy to desire in under a few seconds.",
    revenueImpact: "Estimated recovery: $450-$850/mo",
    action: "Post three short clips per week: one hero dish, one behind-the-scenes moment, and one clear order or visit CTA.",
    priority: "Medium",
    difficulty: "Medium",
    quickWin: "Publish one food-focused reel with a clear order prompt.",
    longTerm: "Create a repeatable content system that tracks which dishes earn saves and shares.",
  },
  {
    title: "Repeat Guest Capture Is Weak",
    teaser: "Owned channels may be missing a simple way to bring diners back.",
    finding:
      "If email, SMS, or loyalty prompts are absent near checkout, the restaurant keeps paying to reacquire the same guests again and again.",
    why:
      "Repeat customers are cheaper to convert than first-time guests and are less likely to be lost to delivery apps or competitor ads.",
    revenueImpact: "Estimated recovery: $650-$1,150/mo",
    action: "Add a simple return offer near checkout and capture guests through email or SMS before they leave the site.",
    priority: "Medium",
    difficulty: "Easy",
    quickWin: "Place a loyalty or return prompt on the menu and checkout flow.",
    longTerm: "Build a monthly guest-return campaign that ties back to new menu specials.",
  },
  {
    title: "AI Competitive Position",
    teaser: "Nearby restaurants are probably winning on visibility, trust, and content cadence.",
    finding:
      "Competitors are likely showing up stronger in short-form content, clearer order prompts, and more active review replies. That combination helps them get the first click and the first visit.",
    why:
      "Guests compare restaurants fast. The brands that look more active and trustworthy usually win before the customer makes a deeper comparison.",
    revenueImpact: "Estimated recovery: $900-$1,800/mo",
    action: "Match competitor posting cadence, tighten search terms, and answer recent complaints publicly so the brand looks more alive and credible.",
    priority: "High",
    difficulty: "Medium",
    quickWin: "Refresh the Instagram bio, post one hero dish clip, and reply to the latest negative review.",
    longTerm: "Track the top three nearby restaurants weekly for content, search presence, and response speed.",
  },
  {
    title: "AI Weekly Monitoring Preview",
    teaser: "This is the subscription layer that catches problems before they become expensive.",
    finding:
      "Weekly monitoring would show visibility changes, review alerts, social performance shifts, and conversion warnings before they snowball into lost weekends.",
    why:
      "Most revenue leaks are small at first. The value of ongoing tracking is catching the pattern early enough to act before demand slips.",
    revenueImpact: "Estimated protection: $400-$900/mo",
    action: "Set weekly thresholds for local visibility, review sentiment, social traction, and mobile CTA performance.",
    priority: "Medium",
    difficulty: "Easy",
    quickWin: "Turn on weekly alerts and create a single snapshot review each Monday.",
    longTerm: "Compare trend lines against nearby competitors to spot drift before it hurts revenue.",
  },
];

type PricingPlan = {
  id: "report" | "starter" | "pro";
  name: string;
  price: string;
  billing: string;
  cta: string;
  description: string;
  highlights: string[];
  featured?: boolean;
};

const pricingPlans: PricingPlan[] = [
  {
    id: "report",
    name: "Detailed AI Growth Report",
    price: "$99",
    billing: "One-time",
    cta: "Unlock Full Report",
    description: "A deeper AI-powered restaurant report with exact fixes, conversion leaks, menu/website recommendations, and priority action steps. Instant access after checkout.",
    highlights: ["Full report breakdown", "Competitor-style insights", "Instant access after checkout"],
    featured: true,
  },
  {
    id: "starter",
    name: "Growth Monitor Starter",
    price: "$49",
    billing: "Monthly",
    cta: "Start Monitoring",
    description: "Weekly AI monitoring for your restaurant’s website, visibility, reviews, and social presence.",
    highlights: ["Weekly scan checks", "Review signals", "Mobile conversion alerts"],
  },
  {
    id: "pro",
    name: "Growth Monitor Pro",
    price: "$99",
    billing: "Monthly",
    cta: "Go Pro",
    description:
      "Advanced AI monitoring with competitor checks, review intelligence, social content ideas, and priority growth recommendations.",
    highlights: ["Competitor tracking", "Priority alerts", "Advanced recommendations"],
  },
];

export default function AuditApp() {
  const [phase, setPhase] = useState<"form" | "scan" | "results">("form");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [reportUnlocked, setReportUnlockedState] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<PricingPlan["id"] | null>(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [form, setForm] = useState<AuditInput>({
    restaurant: "",
    website: "",
    instagram: "",
    tiktok: "",
    cuisine: "",
    city: "",
  });
  const auditRequestRef = useRef<Promise<AuditResult> | null>(null);
  const auditAbortRef = useRef<AbortController | null>(null);
  const auditTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const storedResult = loadReportResult();
    const queryParams = new URLSearchParams(window.location.search);
    const queryUnlocked = queryParams.get("report") === "full" || queryParams.get("access") === "full";
    const querySessionId = queryParams.get("session_id")?.trim() || "";
    const storedUnlocked = isReportUnlocked();

    if (storedResult) {
      setResult(storedResult);
      setPhase("results");
    }

    if (queryUnlocked || storedUnlocked) {
      setReportUnlockedState(true);
      setPricingOpen(false);
      setReportUnlocked(true);
      if (!querySessionId) {
        queryParams.delete("report");
        queryParams.delete("access");
        const nextUrl = `${window.location.pathname}${queryParams.toString() ? `?${queryParams.toString()}` : ""}${window.location.hash}`;
        window.history.replaceState({}, "", nextUrl);
      }
    }

    if (querySessionId) {
      void (async () => {
        try {
          const response = await fetch("/api/purchase-access", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: querySessionId }),
          });

          if (!response.ok) return;

          const data = (await response.json()) as { unlocked?: boolean };
          if (!data.unlocked) return;

          setReportUnlockedState(true);
          setReportUnlocked(true);
          setPricingOpen(false);
          queryParams.delete("report");
          queryParams.delete("access");
          queryParams.delete("session_id");
          const nextUrl = `${window.location.pathname}${queryParams.toString() ? `?${queryParams.toString()}` : ""}${window.location.hash}`;
          window.history.replaceState({}, "", nextUrl);
        } catch {
          // Keep the URL intact so the user can retry.
        }
      })();
    }
  }, []);

  useEffect(() => {
    if (phase !== "scan") return;

    const timers = scanSteps.map((_, index) =>
      window.setTimeout(() => setStep(index), index * 720),
    );
    const finish = window.setTimeout(async () => {
      const nextResult = auditRequestRef.current ? await auditRequestRef.current : generateAudit(form);
      setResult(nextResult);
      setPhase("results");
    }, scanSteps.length * 720 + 300);

    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(finish);
      if (auditTimeoutRef.current) window.clearTimeout(auditTimeoutRef.current);
      auditAbortRef.current?.abort();
    };
  }, [form, phase]);

  useEffect(() => {
    if (phase !== "results") return;
    if (reportUnlocked) {
      setPricingOpen(false);
      return;
    }

    const pricingTimer = window.setTimeout(() => setPricingOpen(true), 1200);
    const scrollTimer = window.setTimeout(() => {
      document.getElementById("report-results")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);

    return () => {
      window.clearTimeout(pricingTimer);
      window.clearTimeout(scrollTimer);
    };
  }, [phase, reportUnlocked]);

  useEffect(() => {
    if (result) saveReportResult(result);
  }, [result]);

  useEffect(() => {
    if (phase !== "results" || !result || reportUnlocked) return;

    let cancelled = false;

    async function checkServerUnlock() {
      try {
        const response = await fetch("/api/purchase-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            restaurantName: form.restaurant,
            restaurantWebsite: form.website,
          }),
        });

        if (!response.ok) return;

        const data = (await response.json()) as { unlocked?: boolean };
        if (!cancelled && data.unlocked) {
          setReportUnlockedState(true);
          setReportUnlocked(true);
          setPricingOpen(false);
        }
      } catch {
        // Quiet fallback to the instant local unlock state.
      }
    }

    void checkServerUnlock();

    return () => {
      cancelled = true;
    };
  }, [form.restaurant, form.website, phase, reportUnlocked, result]);

  useEffect(() => {
    if (reportUnlocked) setPricingOpen(false);
  }, [reportUnlocked]);

  function submitAudit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStep(0);
    auditAbortRef.current?.abort();
    const auditInput = {
      ...form,
      cuisine: form.cuisine || "",
      city: form.city || "",
    };

    const controller = new AbortController();
    auditAbortRef.current = controller;
    if (auditTimeoutRef.current) window.clearTimeout(auditTimeoutRef.current);
    auditTimeoutRef.current = window.setTimeout(() => controller.abort(), 12000);
    auditRequestRef.current = fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(auditInput),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (auditTimeoutRef.current) window.clearTimeout(auditTimeoutRef.current);
        if (!response.ok) {
          throw new Error("Failed to generate audit.");
        }
        return (await response.json()) as AuditResult;
      })
      .catch(() => generateAudit(auditInput));
    setPhase("scan");
  }

  async function startCheckout(planId: PricingPlan["id"], auditData = form) {
    try {
      setCheckoutPlan(planId);
      setCheckoutError("");

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          restaurantName: auditData.restaurant,
          restaurantWebsite: auditData.website,
          restaurantInstagram: auditData.instagram,
          restaurantTikTok: auditData.tiktok,
          cuisine: auditData.cuisine,
          city: auditData.city,
        }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to start checkout.");
      }

      window.location.href = data.url;
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Checkout failed. Please try again.");
    } finally {
      setCheckoutPlan(null);
    }
  }

  return (
    <main className="relative min-h-screen overflow-x-clip px-4 py-5 text-white antialiased sm:px-6 lg:px-8">
      <AmbientFood />
      <nav className="relative z-10 mx-auto flex w-full max-w-[1180px] items-center justify-between py-3">
        <div className="flex items-center gap-3.5">
          <div className="grid size-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,#D7FF2F,#9DFF00)] text-ink shadow-[0_0_32px_rgba(198,255,0,.42)] transition duration-300 hover:rotate-[-4deg] hover:scale-105">
            <ChefHat size={23} />
          </div>
          <span className="text-2xl font-black tracking-[-0.04em]">{brandName}</span>
        </div>
        <a href="#audit" className="rounded-full border border-lime/25 bg-white/[0.04] px-5 py-2.5 text-sm font-black text-white/86 shadow-[inset_0_1px_0_rgba(255,255,255,.07)] transition hover:border-lime/65 hover:bg-lime/10 hover:text-white">
          {mainCtaLabel}
        </a>
      </nav>

      <section className="relative z-10 mx-auto grid w-full max-w-[1180px] min-w-0 items-start gap-8 pb-12 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,.92fr)_minmax(0,1fr)] lg:gap-7 lg:pb-16 lg:pt-14 xl:grid-cols-[minmax(0,.88fr)_minmax(0,.98fr)]">
        <motion.div className="min-w-0 lg:pt-8" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-lime/30 bg-lime/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.11em] text-lime shadow-[0_0_28px_rgba(198,255,0,.12)]">
            <span className="size-2 rounded-full bg-lime shadow-[0_0_16px_rgba(198,255,0,.9)]" />
            Free 60-second leak scan
          </div>
          <h1 className="max-w-5xl text-[3.15rem] font-extrabold uppercase leading-[0.94] tracking-[-0.062em] text-white sm:text-[4.75rem] lg:text-[4.05rem] xl:text-[4.95rem]">
            Your restaurant is
            <span className="neon-headline block">leaking revenue.</span>
          </h1>
          <p className="mt-6 max-w-[41rem] text-base leading-7 text-white/74 sm:text-lg sm:leading-8">
            {brandName} generates AI-generated growth snapshots and recommendations from your restaurant’s public presence to identify hidden customer friction, trust gaps, and lost revenue opportunities before guests choose somewhere else.
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
              {mainCtaLabel}
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
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-lime">AI snapshot</p>
                      <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">See what guests notice first.</h2>
                      <p className="mt-3 text-sm leading-6 text-white/62">Enter your details and we’ll generate AI-generated growth snapshots and recommendations from your public links in about 60 seconds. It’s a fast signal, not a guaranteed live audit.</p>
                    </div>
                    <Input label="Restaurant Name" value={form.restaurant} onChange={(restaurant) => setForm({ ...form, restaurant })} placeholder="Marlow’s Bistro" required />
                    <Input label="Website" value={form.website} onChange={(website) => setForm({ ...form, website })} placeholder="https://restaurant.com" required />
                    <Input label="Instagram" value={form.instagram} onChange={(instagram) => setForm({ ...form, instagram })} placeholder="@restaurant" required />
                    <Input label="TikTok optional" value={form.tiktok || ""} onChange={(tiktok) => setForm({ ...form, tiktok })} placeholder="@restaurant" />
                    <button className="group mt-3 flex w-full items-center justify-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#D7FF2F,#A7FF00)] px-5 py-5 text-base font-black uppercase text-ink shadow-[0_0_46px_rgba(198,255,0,.34)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_0_72px_rgba(198,255,0,.46)] focus:outline-none focus:ring-4 focus:ring-lime/25">
                      {mainCtaLabel}
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
        {phase === "results" && result && (
          <Results
            result={result}
            restart={() => setPhase("form")}
            pricingOpen={pricingOpen}
            closePricing={() => setPricingOpen(false)}
            startCheckout={startCheckout}
            checkoutPlan={checkoutPlan}
            checkoutError={checkoutError}
            openPricing={() => setPricingOpen(true)}
            reportUnlocked={reportUnlocked}
          />
        )}
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

function ReportCard({
  children,
  className = "",
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={`glass min-w-0 rounded-[1.5rem] p-5 sm:p-6 lg:p-8 ${className}`} {...rest}>
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

function Results({
  result,
  restart,
  pricingOpen,
  closePricing,
  startCheckout,
  checkoutPlan,
  checkoutError,
  openPricing,
  reportUnlocked,
}: {
  result: AuditResult;
  restart: () => void;
  pricingOpen: boolean;
  closePricing: () => void;
  startCheckout: (planId: PricingPlan["id"]) => Promise<void>;
  checkoutPlan: PricingPlan["id"] | null;
  checkoutError: string;
  openPricing: () => void;
  reportUnlocked: boolean;
}) {
  return (
    <>
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

        <PremiumSectionGrid unlocked={reportUnlocked} />

        <PricingSection
          reportUnlocked={reportUnlocked}
          checkoutPlan={checkoutPlan}
          checkoutError={checkoutError}
          onCheckout={startCheckout}
        />

        <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 text-center sm:p-6 lg:mt-8">
          <p className="text-base font-bold leading-7 text-white/74">Report preview complete. The fastest path is fixing the top opportunity first, then using the score cards as your weekly growth checklist.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button onClick={openPricing} className="w-full rounded-2xl bg-[linear-gradient(135deg,#D7FF2F,#A7FF00)] px-5 py-4 font-black uppercase text-ink shadow-[0_0_42px_rgba(198,255,0,.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_62px_rgba(198,255,0,.4)] sm:w-auto">
              {reportUnlocked ? "Full Growth Plan Unlocked" : "Unlock Full Growth Plan"}
            </button>
            <button onClick={restart} className="w-full rounded-2xl border border-white/15 bg-white/[0.035] px-5 py-4 font-black uppercase text-white/80 transition duration-300 hover:-translate-y-0.5 hover:border-lime/50 hover:bg-lime/[0.06] hover:text-white sm:w-auto">
              Scan another restaurant
            </button>
          </div>
        </div>
      </motion.section>

      <PricingModal
        open={pricingOpen}
        onClose={closePricing}
        reportUnlocked={reportUnlocked}
        checkoutPlan={checkoutPlan}
        checkoutError={checkoutError}
        onCheckout={startCheckout}
      />
    </>
  );
}

function PremiumSectionGrid({ unlocked }: { unlocked: boolean }) {
  const mainSections = premiumSections.slice(0, -1);
  const monitoringSection = premiumSections[premiumSections.length - 1];

  return (
    <ReportCard className="mt-6 border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,.045),rgba(14,19,32,.92))] shadow-[0_0_28px_rgba(0,0,0,.18)] lg:mt-8">
      <div className="mb-5 flex min-w-0 flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-lime">
            {unlocked ? "Full AI analysis" : "Premium sections locked"}
          </p>
          <h3 className="mt-3 text-2xl font-black leading-tight text-white sm:text-3xl">
            {unlocked ? "Your deeper restaurant intelligence is now visible." : "Locked premium sections reveal the next layer of growth."}
          </h3>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/64 sm:text-base sm:leading-7">
            {unlocked
              ? "These are the deeper AI findings and recommendations the paid report unlocks immediately."
              : "These sections stay blurred until checkout, so users can see the value before they buy."}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/70">
          <ShieldCheck size={14} className="text-lime" />
          {unlocked ? "Premium Report Unlocked" : "Instant access after checkout"}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {mainSections.map((section) => (
          <PremiumSectionCard key={section.title} section={section} unlocked={unlocked} />
        ))}
        <PremiumSectionCard key={monitoringSection.title} section={monitoringSection} unlocked={unlocked} className="md:col-span-2" wide />
      </div>
    </ReportCard>
  );
}

function PremiumSectionCard({
  section,
  unlocked,
  className = "",
  wide = false,
}: {
  section: PremiumSection;
  unlocked: boolean;
  className?: string;
  wide?: boolean;
}) {
  const isMonitoringPreview = section.title === "AI Weekly Monitoring Preview";

  return (
    <div
      className={`relative min-w-0 overflow-hidden rounded-[1.45rem] border border-white/10 bg-black/24 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-lime/25 hover:bg-black/28 sm:p-6 ${
        className
      }`}
    >
      <div className={`min-w-0 ${unlocked ? "" : "select-none opacity-30 blur-[2px]"}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime/85">{unlocked ? "AI finding" : "Locked insight"}</p>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/52">
              {unlocked ? "AI depth" : "Preview"}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/52">
              {section.priority}
            </span>
          </div>
        </div>
        <h4 className="mt-3 text-lg font-black leading-tight text-white">{section.title}</h4>
        <p className="mt-2 text-sm leading-6 text-white/62">{unlocked ? section.finding : section.teaser}</p>
        {unlocked ? (
          <div className={`mt-4 ${wide || isMonitoringPreview ? "grid gap-3 xl:grid-cols-[1.05fr_.95fr]" : "space-y-3"}`}>
            <div className="space-y-3">
              <InsightLine label="Why it matters" value={section.why} />
              <InsightLine label="Revenue impact" value={section.revenueImpact} accent="gold" />
              <InsightLine label="Recommended action" value={section.action} />
            </div>
            {wide || isMonitoringPreview ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <MiniSignal title="Weekly visibility changes" body="Track ranking drift, profile views, and direction taps before they fall off." />
                <MiniSignal title="Review alerts" body="Catch new low-rated reviews fast and reply before trust compounds downward." />
                <MiniSignal title="Social performance tracking" body="See which reels, dishes, and posting windows are building the most reach." />
                <MiniSignal title="Conversion warnings" body="Flag mobile CTA, menu, and order-path drops the same week they appear." />
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/44">Quick win</p>
                  <p className="mt-1 text-sm leading-6 text-white/78">{section.quickWin}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/44">Implementation difficulty</p>
                  <p className="mt-1 text-sm font-black leading-6 text-white">{section.difficulty}</p>
                </div>
              </div>
            )}
            {!(wide || isMonitoringPreview) ? (
              <div className="rounded-2xl border border-lime/15 bg-lime/[0.05] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-lime/80">Long-term fix</p>
                <p className="mt-1 text-sm leading-6 text-white/78">{section.longTerm}</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-lime/15 bg-lime/[0.05] p-3 xl:col-span-1">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-lime/80">Long-term fix</p>
                <p className="mt-1 text-sm leading-6 text-white/78">{section.longTerm}</p>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {!unlocked ? (
        <div className="absolute inset-0 flex flex-col justify-between bg-[linear-gradient(180deg,rgba(5,8,22,.2),rgba(5,8,22,.62))] p-5 sm:p-6">
          <div className="flex items-center gap-2 rounded-full border border-lime/25 bg-lime/[0.08] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-lime">
            <AlertTriangle size={13} />
            Locked
          </div>
          <div className="max-w-[14rem] rounded-2xl border border-white/10 bg-black/35 px-3 py-2 text-sm leading-6 text-white/82 backdrop-blur-sm">
            Unlock to reveal this AI finding and the recommended fixes.
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MiniSignal({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-lime/80">{title}</p>
      <p className="mt-1 text-sm leading-6 text-white/74">{body}</p>
    </div>
  );
}

function InsightLine({
  label,
  value,
  accent = "default",
}: {
  label: string;
  value: string;
  accent?: "default" | "gold";
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
      <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${accent === "gold" ? "text-gold" : "text-lime/80"}`}>{label}</p>
      <p className="mt-1 text-sm leading-6 text-white/78 [overflow-wrap:anywhere]">{value}</p>
    </div>
  );
}

function PricingSection({
  reportUnlocked,
  onCheckout,
  checkoutPlan,
  checkoutError,
}: {
  reportUnlocked: boolean;
  onCheckout: (planId: PricingPlan["id"], auditData?: AuditInput) => Promise<void>;
  checkoutPlan: PricingPlan["id"] | null;
  checkoutError: string;
}) {
  return (
    <ReportCard className="mt-6 border-lime/15 bg-[linear-gradient(145deg,rgba(198,255,0,.08),rgba(14,19,32,.95))] shadow-glow lg:mt-8" id="pricing">
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-lime">
            {reportUnlocked ? "Premium report unlocked" : "Unlock AI-generated growth snapshots"}
          </p>
          <h3 className="mt-3 text-2xl font-black leading-tight text-white sm:text-3xl">
            {reportUnlocked
              ? "Your AI-generated growth snapshots and recommendations are ready."
              : "Your free scan found 3 revenue leaks. Unlock the full AI growth plan."}
          </h3>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/64 sm:text-base sm:leading-7">
            {reportUnlocked
              ? "You now have instant access to AI-generated growth snapshots and recommendations, while weekly monitoring remains available below."
              : "Get deeper AI-generated growth snapshots and recommendations, weekly monitoring, review intelligence, conversion recommendations, and competitor tracking."}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/70">
          <ShieldCheck size={14} className="text-lime" />
          {reportUnlocked ? "Purchase Complete" : "Secure Stripe Checkout"}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pricingPlans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            onCheckout={onCheckout}
            loading={checkoutPlan === plan.id}
            reportUnlocked={reportUnlocked && plan.id === "report"}
          />
        ))}
      </div>

      {checkoutError ? <p className="mt-4 text-sm font-medium text-red-300">{checkoutError}</p> : null}
    </ReportCard>
  );
}

function PricingModal({
  open,
  onClose,
  reportUnlocked,
  onCheckout,
  checkoutPlan,
  checkoutError,
}: {
  open: boolean;
  onClose: () => void;
  reportUnlocked: boolean;
  onCheckout: (planId: PricingPlan["id"], auditData?: AuditInput) => Promise<void>;
  checkoutPlan: PricingPlan["id"] | null;
  checkoutError: string;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-5"
        >
          <button aria-label="Close pricing modal" onClick={onClose} className="absolute inset-0 bg-black/72 backdrop-blur-[12px]" />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            className="glass relative z-10 w-full max-w-5xl overflow-hidden rounded-[2rem] p-5 shadow-[0_30px_120px_rgba(0,0,0,.65)] sm:p-6 lg:p-7"
            style={{ maxHeight: "calc(100vh - 2rem)", overflowY: "auto" }}
          >
            <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-lime">
            {reportUnlocked ? "Premium report unlocked" : "Premium unlock"}
          </p>
                <h3 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl">
                  {reportUnlocked
                    ? "Your AI-generated growth snapshots and recommendations are ready."
                    : "Your free scan found 3 revenue leaks. Unlock the full AI growth plan."}
                </h3>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/64 sm:text-base sm:leading-7">
                  {reportUnlocked
                    ? "Instant access is already available. Weekly monitoring offers deeper ongoing visibility below."
                    : "Get deeper AI-generated growth snapshots and recommendations, weekly monitoring, review intelligence, conversion recommendations, and competitor tracking."}
                </p>
              </div>
              <button onClick={onClose} className="self-start rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/70 transition hover:border-lime/30 hover:bg-lime/[0.08] hover:text-white">
                Close
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pricingPlans.map((plan) => (
                <PricingCard
                  key={plan.id}
                  plan={plan}
                  onCheckout={onCheckout}
                  loading={checkoutPlan === plan.id}
                  reportUnlocked={reportUnlocked && plan.id === "report"}
                  modal
                />
              ))}
            </div>
            {checkoutError ? <p className="mt-4 text-sm font-medium text-red-300">{checkoutError}</p> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function PricingCard({
  plan,
  onCheckout,
  loading,
  reportUnlocked,
  modal = false,
}: {
  plan: PricingPlan;
  onCheckout: (planId: PricingPlan["id"], auditData?: AuditInput) => Promise<void>;
  loading: boolean;
  reportUnlocked: boolean;
  modal?: boolean;
}) {
  const unlockedReport = reportUnlocked && plan.id === "report";

  return (
    <div
      className={`group flex min-w-0 flex-col rounded-[1.6rem] border bg-[linear-gradient(145deg,rgba(255,255,255,.05),rgba(14,19,32,.92))] p-5 transition duration-300 hover:-translate-y-1 hover:border-lime/30 hover:shadow-[0_0_32px_rgba(198,255,0,.1)] sm:p-6 ${
        unlockedReport
          ? "border-lime/35 bg-[linear-gradient(145deg,rgba(198,255,0,.10),rgba(14,19,32,.92))] shadow-glow opacity-75"
          : plan.featured
            ? "border-lime/30 shadow-glow"
            : "border-white/10"
      } ${modal ? "lg:min-h-[26rem]" : "min-h-full"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {unlockedReport ? (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-lime/25 bg-lime/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-lime">
              <CheckCircle2 size={12} />
              Purchased
            </div>
          ) : (
            <p className="text-xs font-black uppercase tracking-[0.16em] text-lime/90">
              {plan.featured ? "Most popular" : "Plan"}
            </p>
          )}
          <h4 className="mt-2 text-xl font-black leading-tight text-white">{plan.name}</h4>
        </div>
        <div className={`rounded-full p-2 ${unlockedReport ? "border border-lime/25 bg-lime/15 text-lime" : "border border-white/10 bg-white/[0.04] text-lime"}`}>
          {unlockedReport ? <CheckCircle2 size={16} /> : <CreditCard size={16} />}
        </div>
      </div>

      <div className="mt-5 flex items-end gap-2">
        <span className="text-4xl font-black tracking-[-0.06em] text-white">{plan.price}</span>
        <span className="pb-1 text-sm font-bold text-white/56">{plan.billing}</span>
      </div>

      <p className="mt-4 text-sm leading-6 text-white/64">
        {unlockedReport ? "Purchased. Your full AI report is already unlocked above." : plan.description}
      </p>

      <ul className="mt-5 space-y-2">
        {unlockedReport ? (
          <li className="flex items-center gap-2 text-sm text-lime">
            <CheckCircle2 size={15} className="text-lime" />
            Purchased and unlocked
          </li>
        ) : (
          plan.highlights.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-white/72">
              <CheckCircle2 size={15} className="text-lime" />
              {item}
            </li>
          ))
        )}
      </ul>

      <button
        onClick={() => onCheckout(plan.id)}
        disabled={loading || unlockedReport}
        className={`group mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black uppercase tracking-[-0.01em] transition duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 ${
          unlockedReport
            ? "border border-lime/25 bg-lime/15 text-lime shadow-none hover:translate-y-0"
            : "bg-[linear-gradient(135deg,#D7FF2F,#A7FF00)] text-ink shadow-[0_0_42px_rgba(198,255,0,.28)] hover:shadow-[0_0_64px_rgba(198,255,0,.42)]"
        }`}
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : null}
        {unlockedReport ? "Purchased" : plan.cta}
        {!loading && !unlockedReport ? <ArrowRight size={17} className="transition group-hover:translate-x-1" /> : null}
      </button>
    </div>
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
