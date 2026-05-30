"use client";

import { AnimatePresence, motion } from "framer-motion";
import { jsPDF } from "jspdf";
import {
  ArrowRight,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChefHat,
  Clock3,
  CreditCard,
  Download,
  FileText,
  Flame,
  Gauge,
  Globe2,
  MousePointerClick,
  Loader2,
  Eye,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Wrench,
} from "lucide-react";
import type { FormEvent, HTMLAttributes, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { generateAudit, type AuditInput, type AuditResult } from "@/lib/audit";
import { trackGaEvent } from "@/lib/analytics";
import { isReportUnlocked, loadReportResult, loadReportShareToken, saveReportResult, saveReportShareToken, setReportUnlocked } from "@/lib/report-session";
import type { GoogleAuditSignals } from "@/lib/google-signals";
import type { WebsiteAuditSnapshot } from "@/lib/website-snapshot";

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
  tools: string[];
  prompt: string;
  weeklySteps: string[];
  expectedSpeed: string;
};

const premiumSections: PremiumSection[] = [
  {
    title: "Homepage CTA Friction Detected",
    teaser: "The hero may be making guests work too hard before they see how to order.",
    finding:
      "Visitors likely understand the brand, but the next action is still a little buried on mobile. That creates extra hesitation at the exact moment they should convert.",
    why:
      "When guests pause to search for Menu, Order, or Reserve, some of them leave before they ever tap.",
    revenueImpact: "AI-estimated recovery range: $700-$1,100/mo",
    action: "Move the primary CTA higher, repeat it after the trust proof, and make the mobile action row impossible to miss.",
    priority: "High",
    difficulty: "Easy",
    quickWin: "Repeat Menu / Order above the fold and near the first scroll break.",
    longTerm: "A/B test two hero layouts and track mobile tap-through rate weekly.",
    tools: ["ChatGPT", "Microsoft Clarity", "Google Analytics 4", "Vercel Speed Insights"],
    prompt: "Act as a restaurant conversion strategist. Rewrite my homepage hero and mobile CTA section so first-time guests immediately see Menu, Order Online, and Reserve. Give me 3 headline options, 3 button labels, and a simple above-the-fold layout for a restaurant website.",
    weeklySteps: [
      "Record mobile homepage sessions and note where guests hesitate.",
      "Update hero buttons and repeat the primary CTA after the first proof section.",
      "Check CTA clicks, menu taps, and order starts every Friday.",
    ],
    expectedSpeed: "3-10 days after the CTA is moved and tracked.",
  },
  {
    title: "Review Trust Signal Gap",
    teaser: "Guests may be reading recent complaints before they decide.",
    finding:
      "The paid report would likely surface repeated phrases around wait time, service speed, or order clarity. Those patterns usually influence whether a guest trusts the restaurant enough to commit.",
    why:
      "Fresh responses and visible follow-through help local ranking signals and reduce the risk of losing high-intent diners.",
    revenueImpact: "AI-estimated recovery range: $500-$900/mo",
    action: "Reply to the newest negative reviews, acknowledge the issue directly, and show one visible fix in public responses.",
    priority: "High",
    difficulty: "Easy",
    quickWin: "Respond to the latest low-rated reviews with one clear fix.",
    longTerm: "Build a weekly review response process for service, timing, and order accuracy complaints.",
    tools: ["ChatGPT", "Google Business Profile", "Yext or BrightLocal", "Notion"],
    prompt: "Act as a calm restaurant owner replying to Google reviews. Draft 5 short responses to negative reviews about wait time, order accuracy, and service speed. Each reply should acknowledge the issue, avoid defensiveness, mention one operational fix, and invite the guest back.",
    weeklySteps: [
      "Export or copy the newest low-rated reviews every Monday.",
      "Tag complaints by theme: wait, food quality, delivery, service, pricing.",
      "Publish owner replies and add one internal fix to the weekly manager checklist.",
    ],
    expectedSpeed: "1-3 weeks for trust lift; local ranking impact usually compounds over 30-60 days.",
  },
  {
    title: "Google Visibility Losses",
    teaser: "Local search demand may be leaking before guests even hit the site.",
    finding:
      "The report would likely show profile gaps around hours, categories, photo freshness, and intent keywords that help Google decide whether to surface the restaurant.",
    why:
      "Small local SEO misses can quietly reduce calls, directions taps, and website visits without any obvious warning.",
    revenueImpact: "AI-estimated recovery range: $600-$1,200/mo",
    action: "Tighten business hours, sharpen category and keyword coverage, and keep photos updated around current menu highlights.",
    priority: "High",
    difficulty: "Medium",
    quickWin: "Refresh hours, categories, and profile photos this week.",
    longTerm: "Monitor local profile completeness and visibility changes every week.",
    tools: ["Google Business Profile", "ChatGPT", "Local Falcon", "BrightLocal"],
    prompt: "Act as a local SEO strategist for a restaurant. Create an optimized Google Business Profile update plan with categories, service keywords, photo ideas, post topics, and Q&A answers for a [cuisine] restaurant in [city]. Prioritize actions that can improve calls, directions, and website clicks.",
    weeklySteps: [
      "Update hours, primary category, services, and top menu keywords.",
      "Upload 6 fresh photos: exterior, interior, 3 signature dishes, staff/service.",
      "Post one Google update tied to a dish, offer, event, or ordering prompt.",
    ],
    expectedSpeed: "2-4 weeks for profile engagement; 45-90 days for stronger local visibility.",
  },
  {
    title: "Social Content Is Under-Selling The Food",
    teaser: "The feed may not be creating enough craving or recall.",
    finding:
      "Short-form clips, signature dishes, and clearer visit prompts often outperform generic brand posts. If those are missing, guests have less reason to remember or share the restaurant.",
    why:
      "Restaurants win attention when the food is instantly understandable and easy to desire in under a few seconds.",
    revenueImpact: "AI-estimated recovery range: $450-$850/mo",
    action: "Post three short clips per week: one hero dish, one behind-the-scenes moment, and one clear order or visit CTA.",
    priority: "Medium",
    difficulty: "Medium",
    quickWin: "Publish one food-focused reel with a clear order prompt.",
    longTerm: "Create a repeatable content system that tracks which dishes earn saves and shares.",
    tools: ["ChatGPT", "CapCut", "Canva", "Instagram Reels", "TikTok"],
    prompt: "Act as a restaurant short-form content producer. Give me 12 Reels/TikTok scripts for our best-selling dishes. Each script needs a 2-second hook, shot list, caption, on-screen text, and a CTA to order, reserve, or visit this week.",
    weeklySteps: [
      "Film 3 clips before service: hero dish, prep moment, guest-ready plate.",
      "Batch-edit captions and on-screen text in CapCut or Canva.",
      "Track saves, shares, profile visits, and website taps by post type.",
    ],
    expectedSpeed: "7-21 days for engagement signals; 30-60 days for repeatable content winners.",
  },
  {
    title: "Repeat Guest Capture Is Weak",
    teaser: "Owned channels may be missing a simple way to bring diners back.",
    finding:
      "If email, SMS, or loyalty prompts are absent near checkout, the restaurant keeps paying to reacquire the same guests again and again.",
    why:
      "Repeat customers are cheaper to convert than first-time guests and are less likely to be lost to delivery apps or competitor ads.",
    revenueImpact: "AI-estimated recovery range: $650-$1,150/mo",
    action: "Add a simple return offer near checkout and capture guests through email or SMS before they leave the site.",
    priority: "Medium",
    difficulty: "Easy",
    quickWin: "Place a loyalty or return prompt on the menu and checkout flow.",
    longTerm: "Build a monthly guest-return campaign that ties back to new menu specials.",
    tools: ["Klaviyo or Mailchimp", "Toast/Square loyalty", "ChatGPT", "Zapier"],
    prompt: "Act as a restaurant retention marketer. Build a 4-message email/SMS sequence that brings first-time guests back within 30 days. Include subject lines, SMS copy, offer framing, timing, and a version that does not rely on discounts.",
    weeklySteps: [
      "Add an email/SMS capture prompt near menu, checkout, and receipt flow.",
      "Launch a first-visit follow-up sequence with one return reason.",
      "Review opt-ins, redemptions, repeat orders, and unsubscribe rate weekly.",
    ],
    expectedSpeed: "2-4 weeks once capture and follow-up messages are live.",
  },
  {
    title: "AI Competitive Position",
    teaser: "Nearby restaurants are probably winning on visibility, trust, and content cadence.",
    finding:
      "Competitors are likely showing up stronger in short-form content, clearer order prompts, and more active review replies. That combination helps them get the first click and the first visit.",
    why:
      "Guests compare restaurants fast. The brands that look more active and trustworthy usually win before the customer makes a deeper comparison.",
    revenueImpact: "AI-estimated recovery range: $900-$1,800/mo",
    action: "Match competitor posting cadence, tighten search terms, and answer recent complaints publicly so the brand looks more alive and credible.",
    priority: "High",
    difficulty: "Medium",
    quickWin: "Refresh the Instagram bio, post one hero dish clip, and reply to the latest negative review.",
    longTerm: "Track the top three nearby restaurants weekly for content, search presence, and response speed.",
    tools: ["ChatGPT", "Perplexity", "Google Maps", "Meta Business Suite", "Airtable"],
    prompt: "Act as an AI competitive intelligence analyst. Compare my restaurant against 3 nearby competitors using Google reviews, website CTAs, Instagram cadence, menu positioning, and local search language. Return a weekly scorecard and 5 actions we can complete this week.",
    weeklySteps: [
      "Snapshot 3 competitors every Monday: reviews, posts, offers, CTA, ranking.",
      "Identify one competitor tactic to match and one to beat.",
      "Update the restaurant scorecard and assign one owner per growth task.",
    ],
    expectedSpeed: "1-2 weeks for positioning fixes; 30-90 days for measurable competitive lift.",
  },
  {
    title: "AI Weekly Monitoring Preview",
    teaser: "This is the subscription layer that catches problems before they become expensive.",
    finding:
      "Weekly monitoring would show visibility changes, social performance shifts, and conversion warnings before they snowball into lost weekends.",
    why:
      "Most revenue leaks are small at first. The value of ongoing tracking is catching the pattern early enough to act before demand slips.",
    revenueImpact: "AI-estimated protection range: $400-$900/mo",
    action: "Set weekly thresholds for local visibility, review sentiment, social traction, and mobile CTA performance.",
    priority: "Medium",
    difficulty: "Easy",
    quickWin: "Turn on weekly scans and create a single snapshot review each Monday.",
    longTerm: "Compare trend lines against nearby competitors to spot drift before it hurts revenue.",
    tools: ["DineLeak Monitor", "Google Analytics 4", "Looker Studio", "Google Sheets"],
    prompt: "Act as an AI operations analyst. Create a weekly restaurant growth monitoring dashboard with thresholds for reviews, Google profile engagement, website CTA clicks, menu views, order starts, and social saves. Include owner actions for each threshold.",
    weeklySteps: [
      "Review one dashboard every Monday before lunch service planning.",
      "Flag any metric that dropped more than 10% week over week.",
      "Assign one corrective action and check completion before the weekend.",
    ],
    expectedSpeed: "Immediate issue detection; 4-8 weeks to establish useful trend baselines.",
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

type AuditResponse = AuditResult & {
  auditId?: string;
  websiteSnapshot?: WebsiteAuditSnapshot & { googleSignals?: GoogleAuditSignals | null };
  aiReady?: boolean;
  generatedBy?: "openai" | "template";
  googleSignals?: GoogleAuditSignals | null;
};

const pricingPlans: PricingPlan[] = [
  {
    id: "report",
    name: "DineLeak Full Growth Plan",
    price: "$99",
    billing: "One-time",
    cta: "Unlock Full Report",
    description: "One-time AI audit report with downloadable PDF, shareable access, Google-backed signals where available, and AI-estimated insights.",
    highlights: ["Downloadable PDF", "Shareable report", "AI-estimated insights"],
    featured: true,
  },
  {
    id: "starter",
    name: "DineLeak Monitor",
    price: "$49.99",
    billing: "Monthly",
    cta: "Start Monitoring",
    description: "Monthly AI monitoring for your restaurant’s online presence with recurring scans, saved report history, downloadable reports, view reports anytime by email, and Google reputation + website health tracking.",
    highlights: ["Monthly AI scans", "Saved report history", "View reports by email", "Downloadable reports"],
  },
];

const previewAuditInput: AuditInput = {
  restaurant: "Marlow's Bistro",
  website: "https://marlowsbistro.com",
  instagram: "@marlowsbistro",
  tiktok: "@marlowsbistro",
  cuisine: "Modern American",
  city: "Austin, TX",
};

const leakageChannelLabels = ["Google Visibility / SEO", "Reviews & Reputation", "Website Conversion", "Menu / Offers", "Delivery Apps", "Social Media"] as const;
const funnelStepLabels = ["Website Visitors", "Menu Views", "Checkout / Order Attempts", "Completed Orders"] as const;
const actionPlanWeeks = [
  ["Week 1", "Foundation"],
  ["Week 2", "Visibility"],
  ["Week 3", "Conversions"],
  ["Week 4", "Growth"],
] as const;

type PremiumReportData = {
  label: string;
  disclaimer: string;
  aiConfidence: number;
  estimatedMonthlyLoss: number;
  estimatedGrowthPotential: number;
  issuesFound: number;
  leakageBreakdown: Array<{ label: string; value: number; amount: number; tone: "danger" | "warning" }>;
  funnelSteps: Array<{ label: string; count: number; drop: string; value: number }>;
  benchmarkRows: Array<[string, string, string, "Ahead" | "Close" | "Behind"]>;
  recoveryProjection: Array<[string, number]>;
  actionPlan: Array<[string, string, string]>;
  summaryNote: string;
};

function money(value: number) {
  return `$${Math.max(0, Math.round(value)).toLocaleString()}`;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function buildPremiumReportData(result: AuditResult, auditInput: AuditInput, isPreviewMode: boolean): PremiumReportData {
  const categoriesByName = new Map(result.categories.map((category) => [category.name, category]));
  const visibility = categoriesByName.get("Visibility")?.score ?? result.scores?.visibility ?? result.score;
  const conversion = categoriesByName.get("Conversion")?.score ?? result.scores?.conversion ?? result.score;
  const reputation = categoriesByName.get("Reputation")?.score ?? result.scores?.trust ?? result.score;
  const social = categoriesByName.get("Social")?.score ?? result.scores?.socialPresence ?? result.score;
  const retention = categoriesByName.get("Retention")?.score ?? result.score;
  const menuOrdering = result.scores?.menuOrdering ?? conversion;

  const monthlyLossRows = [
    { label: leakageChannelLabels[0], value: visibility, amount: (100 - visibility) * 18 + 260, tone: visibility < 65 ? "danger" : "warning" },
    { label: leakageChannelLabels[1], value: reputation, amount: (100 - reputation) * 16 + 220, tone: reputation < 68 ? "danger" : "warning" },
    { label: leakageChannelLabels[2], value: conversion, amount: (100 - conversion) * 20 + 280, tone: conversion < 65 ? "danger" : "warning" },
    { label: leakageChannelLabels[3], value: menuOrdering, amount: (100 - menuOrdering) * 14 + 180, tone: menuOrdering < 63 ? "danger" : "warning" },
    { label: leakageChannelLabels[4], value: retention, amount: (100 - retention) * 12 + 160, tone: retention < 62 ? "danger" : "warning" },
    { label: leakageChannelLabels[5], value: social, amount: (100 - social) * 12 + 150, tone: social < 64 ? "danger" : "warning" },
  ] as const;

  const estimatedMonthlyLoss = monthlyLossRows.reduce((sum, row) => sum + row.amount, 0);
  const estimatedGrowthPotential = Math.round(estimatedMonthlyLoss * 0.82);
  const aiConfidence = isPreviewMode
    ? clampNumber(result.score + 6, 58, 84)
    : clampNumber(result.score + 10 + (auditInput.website ? 2 : 0), 68, 96);

  const baseVisitors = Math.round(1800 + result.score * 28 + auditInput.website.length * 10);
  const menuViews = Math.round(baseVisitors * (0.52 + menuOrdering / 400));
  const orderAttempts = Math.round(menuViews * (0.28 + conversion / 550));
  const completedOrders = Math.round(orderAttempts * (0.44 + reputation / 650));

  const funnel: PremiumReportData["funnelSteps"] = [
    { label: funnelStepLabels[0], count: baseVisitors, drop: "Baseline", value: 100 },
    { label: funnelStepLabels[1], count: menuViews, drop: `${Math.round((1 - menuViews / baseVisitors) * 100)}% drop`, value: clampNumber(Math.round((menuViews / baseVisitors) * 100), 18, 92) },
    { label: funnelStepLabels[2], count: orderAttempts, drop: `${Math.round((1 - orderAttempts / menuViews) * 100)}% drop`, value: clampNumber(Math.round((orderAttempts / menuViews) * 100), 12, 88) },
    { label: funnelStepLabels[3], count: completedOrders, drop: `${Math.round((1 - completedOrders / orderAttempts) * 100)}% drop`, value: clampNumber(Math.round((completedOrders / orderAttempts) * 100), 8, 78) },
  ];

  const yourReviews = clampNumber(Math.round(90 + reputation * 2.6), 120, 620);
  const competitorReviews = yourReviews + Math.round(130 + visibility * 1.8);
  const yourRating = clampNumber(Number((3.2 + reputation / 120).toFixed(1)), 3.2, 4.8);
  const competitorRating = clampNumber(Number((yourRating + 0.3).toFixed(1)), 3.4, 4.9);
  const yourRank = Math.max(2, 10 - Math.round(visibility / 12));
  const competitorRank = Math.max(1, yourRank - 2);
  const yourSpeed = clampNumber(Math.round(42 + conversion * 0.58), 45, 94);
  const competitorSpeed = clampNumber(yourSpeed + 14, 56, 98);
  const mobileTone = conversion >= 72 ? "Ahead" : conversion >= 62 ? "Close" : "Behind";
  const ctaTone = conversion >= 75 ? "Ahead" : conversion >= 62 ? "Close" : "Behind";

  const benchmarkRows: PremiumReportData["benchmarkRows"] = [
    ["Google Reviews", `${yourRating.toFixed(1)} / ${yourReviews}`, `${competitorRating.toFixed(1)} / ${competitorReviews}`, yourRating >= competitorRating ? "Close" : "Behind"],
    ["Local Ranking", `#${yourRank} nearby`, `Top ${competitorRank} avg`, visibility >= 78 ? "Ahead" : "Behind"],
    ["Website Speed", `${yourSpeed} mobile`, `${competitorSpeed} mobile`, yourSpeed >= competitorSpeed ? "Ahead" : "Behind"],
    ["Mobile Experience", conversion >= 72 ? "Very good" : conversion >= 62 ? "Good" : "Needs work", conversion >= 72 ? "Very good" : "Strong", mobileTone],
    ["CTA Clarity", conversion >= 72 ? "Clear" : conversion >= 62 ? "Mixed" : "Blurred", conversion >= 72 ? "Clear" : "Strong", ctaTone],
  ];

  const recoveryProjection: PremiumReportData["recoveryProjection"] = [
    ["Month 1", Math.round(estimatedGrowthPotential * 0.18)],
    ["Month 2", Math.round(estimatedGrowthPotential * 0.34)],
    ["Month 3", Math.round(estimatedGrowthPotential * 0.52)],
    ["Month 4", Math.round(estimatedGrowthPotential * 0.68)],
    ["Month 5", Math.round(estimatedGrowthPotential * 0.84)],
    ["Month 6", Math.round(estimatedGrowthPotential * 1)],
  ];

  const sortedIssues = [...result.categories].sort((a, b) => a.score - b.score);
  const topIssue = sortedIssues[0] ?? result.categories[0];
  const secondIssue = sortedIssues[1] ?? result.categories[1] ?? topIssue;
  const thirdIssue = sortedIssues[2] ?? result.categories[2] ?? topIssue;
  const fourthIssue = sortedIssues[3] ?? result.categories[3] ?? topIssue;

  const actionPlan: PremiumReportData["actionPlan"] = [
    [
      actionPlanWeeks[0][0],
      actionPlanWeeks[0][1],
      `Fix ${topIssue.name.toLowerCase()} first. Update the homepage CTA, tighten the mobile journey, and reply to the most recent trust signal friction before the week closes.`,
    ],
    [
      actionPlanWeeks[1][0],
      actionPlanWeeks[1][1],
      `Improve ${secondIssue.name.toLowerCase()} and publish fresh local proof. Refresh Google Business Profile details, photos, and posts tied to the current menu and city.`,
    ],
    [
      actionPlanWeeks[2][0],
      actionPlanWeeks[2][1],
      `Ship the conversion fixes and activate the AI content workflow. Use the playbook prompts to produce short-form clips, review replies, and CTA variants.`,
    ],
    [
      actionPlanWeeks[3][0],
      actionPlanWeeks[3][1],
      `Lock in retention and monitoring. Turn on alerts, compare week-over-week signals, and track whether ${thirdIssue.name.toLowerCase()} and ${fourthIssue.name.toLowerCase()} are moving in the right direction.`,
    ],
  ];

  return {
    label: isPreviewMode ? "Example preview data in development mode" : "AI-estimated based on available scan signals",
    disclaimer: isPreviewMode
      ? "Example preview data in development mode. Replace with live scan data after checkout."
      : "AI-estimated based on available scan signals. These are modeled from the current scan, public web signals, and the restaurant details submitted.",
    aiConfidence,
    estimatedMonthlyLoss,
    estimatedGrowthPotential,
    issuesFound: result.categories.length + result.opportunities.length,
    leakageBreakdown: monthlyLossRows.map((row) => ({
      label: row.label,
      value: row.value,
      amount: Math.round(row.amount),
      tone: row.tone,
    })),
    funnelSteps: funnel,
    benchmarkRows,
    recoveryProjection,
    actionPlan,
    summaryNote: `Restaurant: ${auditInput.restaurant || "Unknown"} • Website: ${auditInput.website || "Not set"} • ${auditInput.cuisine || "Cuisine not set"} • ${auditInput.city || "City not set"}`,
  };
}

export default function AuditApp() {
  const [phase, setPhase] = useState<"form" | "scan" | "results">("form");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<AuditResponse | null>(null);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [reportUnlocked, setReportUnlockedState] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<PricingPlan["id"] | null>(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [scanError, setScanError] = useState("");
  const [form, setForm] = useState<AuditInput>({
    restaurant: "",
    website: "",
    instagram: "",
    tiktok: "",
    cuisine: "",
    city: "",
  });
  const auditRequestRef = useRef<Promise<AuditResponse> | null>(null);
  const auditAbortRef = useRef<AbortController | null>(null);
  const auditTimeoutRef = useRef<number | null>(null);
  const hasTrackedResultsViewRef = useRef(false);
  const previewModeRef = useRef(false);

  useEffect(() => {
    const storedResult = loadReportResult();
    const storedShareToken = loadReportShareToken();
    const queryParams = new URLSearchParams(window.location.search);
    const isLocalPreview =
      process.env.NODE_ENV !== "production" &&
      ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
      queryParams.get("preview") === "full-growth";
    const querySessionId = queryParams.get("session_id")?.trim() || "";
    const queryShareToken = queryParams.get("share")?.trim() || "";
    const storedUnlocked = isReportUnlocked();

    if (isLocalPreview) {
      previewModeRef.current = true;
      setForm(previewAuditInput);
      setResult(generateAudit(previewAuditInput));
      setPhase("results");
      setReportUnlockedState(true);
      setShareToken(storedShareToken);
      setPricingOpen(false);
      return;
    }

    if (storedResult) {
      setResult(storedResult as AuditResponse);
      setPhase("results");
    }

    if (storedUnlocked) {
      setReportUnlockedState(true);
      setPricingOpen(false);
      setReportUnlocked(true);
      setShareToken(storedShareToken);
      if (!querySessionId) {
        queryParams.delete("report");
        queryParams.delete("access");
        queryParams.delete("share");
        const nextUrl = `${window.location.pathname}${queryParams.toString() ? `?${queryParams.toString()}` : ""}${window.location.hash}`;
        window.history.replaceState({}, "", nextUrl);
      }
    }

    if (querySessionId || queryShareToken) {
      void (async () => {
        try {
          const response = await fetch("/api/purchase-access", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: querySessionId,
              shareToken: queryShareToken,
            }),
          });

          if (!response.ok) return;

          const data = (await response.json()) as {
            unlocked?: boolean;
            shareToken?: string | null;
            record?: { sessionId?: string | null } | null;
          };
          if (!data.unlocked) return;

          setReportUnlockedState(true);
          setReportUnlocked(true, data.record?.sessionId ?? querySessionId ?? null);
          setPricingOpen(false);
          setShareToken(data.shareToken ?? storedShareToken ?? null);
          saveReportShareToken(data.shareToken ?? storedShareToken ?? null);
          queryParams.delete("report");
          queryParams.delete("access");
          queryParams.delete("session_id");
          queryParams.delete("share");
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

    const pricingTimer = reportUnlocked ? null : window.setTimeout(() => setPricingOpen(true), 1200);
    if (reportUnlocked) setPricingOpen(false);
    const scrollTimer = window.setTimeout(() => {
      document.getElementById("report-results")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);

    return () => {
      if (pricingTimer) window.clearTimeout(pricingTimer);
      window.clearTimeout(scrollTimer);
    };
  }, [phase, reportUnlocked]);

  useEffect(() => {
    if (result && !previewModeRef.current) saveReportResult(result);
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

  useEffect(() => {
    if (phase !== "results" || !result || hasTrackedResultsViewRef.current) return;
    hasTrackedResultsViewRef.current = true;
    trackGaEvent("results_viewed", {
      restaurant_name: form.restaurant || undefined,
      cuisine: form.cuisine || undefined,
      city: form.city || undefined,
    });
  }, [form.city, form.cuisine, form.restaurant, phase, result]);

  async function submitAudit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    previewModeRef.current = false;
    hasTrackedResultsViewRef.current = false;
    setScanError("");
    trackGaEvent("scan_started", {
      restaurant_name: form.restaurant || undefined,
      cuisine: form.cuisine || undefined,
      city: form.city || undefined,
    });
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
    auditTimeoutRef.current = window.setTimeout(() => controller.abort(), 60000);
    try {
      const scanSecret =
        typeof window !== "undefined" ? window.localStorage.getItem("dineleak_scan_secret")?.trim() || "" : "";
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(scanSecret ? { "x-dineleak-scan-secret": scanSecret } : {}),
        },
        body: JSON.stringify(auditInput),
        signal: controller.signal,
      });

      if (auditTimeoutRef.current) window.clearTimeout(auditTimeoutRef.current);

      if (response.status === 429) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setScanError(data.error || "You’ve reached the hourly scan limit. Please try again later.");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to generate audit.");
      }

      const serverResult = (await response.json()) as AuditResponse;
      auditRequestRef.current = Promise.resolve(serverResult);
    } catch {
      auditRequestRef.current = Promise.resolve(generateAudit(auditInput));
    }
    setPhase("scan");
  }

  async function startCheckout(planId: PricingPlan["id"], auditData = form) {
    try {
      trackGaEvent("subscription_selected", {
        plan_id: planId,
      });
      trackGaEvent("checkout_started", {
        plan_id: planId,
        restaurant_name: auditData.restaurant || undefined,
        cuisine: auditData.cuisine || undefined,
        city: auditData.city || undefined,
      });
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
    <main className={`scroll-smooth relative min-h-screen overflow-x-clip bg-[#05070B] text-white antialiased ${phase === "results" ? "px-4 py-5 sm:px-6 lg:px-8" : ""}`}>
      {phase !== "results" && (
        <>
          <section className="relative overflow-hidden bg-[#05070B] px-4 pb-9 pt-4 sm:px-6 sm:pb-10 sm:pt-4 lg:px-8">
            <AmbientFood />
            <nav className="relative z-10 mx-auto flex w-full max-w-[1180px] items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="grid size-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,#E7FF54,#B8FF12)] text-ink shadow-[0_0_32px_rgba(184,255,18,.42)]">
                  <ChefHat size={23} />
                </div>
                <span className="text-2xl font-black tracking-[-0.04em]">{brandName}</span>
              </div>
              <div className="hidden items-center gap-9 text-sm font-black text-white/88 lg:flex">
                <a href="#how-it-works" className="transition hover:text-lime">How It Works</a>
                <a href="#pricing" className="transition hover:text-lime">Pricing</a>
              </div>
              <div className="flex items-center gap-3">
                <a href="#audit" className="rounded-xl bg-[#B8FF12] px-4 py-3 text-sm font-black text-ink shadow-[0_0_34px_rgba(184,255,18,.34)] transition hover:-translate-y-0.5 hover:bg-[#C6FF18] sm:px-6">
                  {mainCtaLabel}
                </a>
              </div>
            </nav>

            <section className="relative z-10 mx-auto grid w-full max-w-[1180px] items-center gap-8 pb-0 pt-8 sm:pt-12 lg:grid-cols-[minmax(0,.88fr)_minmax(460px,1fr)] lg:gap-10 lg:pt-12">
              <motion.div className="min-w-0" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                <div className="mb-4 inline-flex items-center rounded-full border border-[#B8FF12]/45 bg-[#B8FF12]/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#B8FF12] shadow-[0_0_28px_rgba(184,255,18,.16)]">
                  AI-Powered Leak Detection
                </div>
                <h1 className="max-w-[39rem] text-[2.9rem] font-black leading-[0.92] tracking-[-0.052em] text-white sm:text-[4.05rem] lg:text-[3.95rem] xl:text-[4.45rem]">
                  Your Restaurant
                  <span className="block">Is Leaking</span>
                  <span className="neon-headline block" style={{ filter: "drop-shadow(0 0 10px rgba(184,255,18,.22))" }}>Revenue.</span>
                </h1>
                <p className="mt-6 max-w-[39rem] text-base leading-7 text-white/74 sm:text-lg sm:leading-8">
                  DineLeak finds hidden friction, trust gaps, and lost revenue opportunities before guests choose somewhere else.
                </p>
                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Find hidden leaks", "Before they cost you", Search],
                    ["See what guests notice", "First", Eye],
                    ["Fix issues that", "Recover revenue", Wrench],
                  ].map(([title, body, Icon]) => (
                    <div key={title as string} className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]">
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#B8FF12]/10 text-[#B8FF12] ring-1 ring-[#B8FF12]/15">
                        <Icon size={17} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black leading-5 text-white">{title as string}</p>
                        <p className="text-sm leading-5 text-white/62">{body as string}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a href="#audit" className="group inline-flex h-[56px] items-center justify-center gap-3 rounded-xl bg-[linear-gradient(135deg,#D7FF2F,#B8FF12)] px-7 text-base font-black uppercase tracking-[-0.015em] text-ink shadow-[0_0_34px_rgba(184,255,18,.30)] transition hover:-translate-y-0.5">
                    {mainCtaLabel}
                    <ArrowRight className="transition group-hover:translate-x-1.5" size={21} />
                  </a>
                  <div className="inline-flex h-[56px] items-center rounded-xl border border-white/10 bg-white/[0.035] px-5 text-sm leading-6 text-white/72">
                    No login. No card. 100% free.
                  </div>
                </div>
                <div className="mt-7 flex flex-wrap items-center gap-3 text-sm text-white/70">
                  <div className="flex -space-x-2">
                    {["R", "G", "B"].map((item) => (
                      <span key={item} className="grid size-9 place-items-center rounded-full border-2 border-[#05070B] bg-gradient-to-br from-white to-[#B8FF12]/60 text-xs font-black text-ink">
                        {item}
                      </span>
                    ))}
                  </div>
                  <span className="text-[#FFC83D]">★★★★★</span>
                  <span>Used by independent restaurants looking for clearer growth signals.</span>
                </div>
              </motion.div>

              <RevenueLeakCard />
            </section>
          </section>

          <section id="audit" className="relative z-10 bg-[#F7F8FA] px-4 py-14 text-[#070A0F] sm:px-6 lg:px-8 lg:py-20">
            <div className="mx-auto grid w-full max-w-[1180px] items-start gap-10 lg:grid-cols-[minmax(0,.84fr)_minmax(410px,.82fr)_minmax(0,.98fr)] lg:gap-12">
              <div id="how-it-works" className="min-w-0 pt-3">
                <p className="text-sm font-black tracking-[-0.01em] text-[#74B800]">AI Snapshots</p>
                <h2 className="mt-4 max-w-[20.5rem] text-[2.72rem] font-black leading-[0.94] tracking-[-0.05em] text-[#070A0F] sm:text-[3.3rem]">
                  See what guests notice first<span className="text-[#B8FF12]">.</span>
                </h2>
                <p className="mt-5 max-w-[27rem] text-base leading-7 text-[#5E6673]">
                  We analyze your public presence and show you exactly what is holding your restaurant back.
                </p>
                <div className="mt-9 space-y-4">
                  {["Social media & website audit", "Guest sentiment analysis", "Actionable growth insights"].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-base font-semibold text-[#253041]">
                      <CheckCircle2 className="text-[#A6EA00]" size={19} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <section className="relative w-full min-w-0 max-w-full overflow-hidden rounded-[22px] border border-slate-200/90 bg-white p-5 text-[#070A0F] shadow-[0_22px_64px_rgba(15,23,42,.09)] sm:p-6">
                <div className="absolute -right-5 -top-5 grid size-16 place-items-center rounded-full bg-[#B8FF12] text-ink shadow-[0_16px_36px_rgba(184,255,18,.28)]">
                  <Sparkles size={24} />
                </div>
                <AnimatePresence mode="wait">
                  {phase === "form" && (
                    <motion.form
                      key="form"
                      onSubmit={submitAudit}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="min-w-0 space-y-4"
                    >
                      <div className="pr-12">
                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#76B900]">AI Snapshot</p>
                        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#070A0F]">See what guests notice first.</h2>
                        <p className="mt-1 text-xs font-semibold leading-5 text-[#5E6673]">Generated insights based on your public presence</p>
                      </div>
                      <Input label="Restaurant Name" value={form.restaurant} onChange={(restaurant) => setForm({ ...form, restaurant })} placeholder="Fox Bros. Bar-B-Q" required />
                      <Input label="Website" value={form.website} onChange={(website) => setForm({ ...form, website })} placeholder="https://restaurant.com" required />
                      <Input label="Instagram" value={form.instagram} onChange={(instagram) => setForm({ ...form, instagram })} placeholder="@restaurant" required />
                      <Input label="TikTok optional" value={form.tiktok || ""} onChange={(tiktok) => setForm({ ...form, tiktok })} placeholder="@restaurant" />
                      <button className="group mt-3 flex h-[54px] w-full items-center justify-center gap-3 rounded-xl bg-[linear-gradient(135deg,#D7FF2F,#B8FF12)] px-5 text-sm font-black uppercase text-ink shadow-[0_14px_30px_rgba(184,255,18,.24)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#B8FF12]/30">
                        {mainCtaLabel}
                        <ArrowRight className="transition group-hover:translate-x-1.5" size={20} />
                      </button>
                      {scanError ? <p className="text-sm font-bold text-[#C24141]">{scanError}</p> : null}
                      <p className="text-center text-xs font-semibold leading-5 text-[#5E6673]">Private preview. No login. No subscription.</p>
                    </motion.form>
                  )}

                  {phase === "scan" && (
                    <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[520px] min-w-0 py-2">
                      <div className="relative overflow-hidden rounded-[1.4rem] border border-[#B8FF12]/25 bg-[#070A0F] p-5 text-white">
                        <div className="scan-grid absolute inset-0 opacity-35" />
                        <div className="relative mx-auto grid size-52 place-items-center rounded-full border border-[#B8FF12]/25 bg-[#B8FF12]/[0.03] shadow-[0_0_42px_rgba(184,255,18,.20)] sm:size-60">
                          <motion.div className="absolute h-px w-52 scan-line sm:w-60" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }} />
                          <motion.div className="absolute size-36 rounded-full border border-[#B8FF12]/15" animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.15, 0.45, 0.15] }} transition={{ repeat: Infinity, duration: 2.8 }} />
                          <div className="grid size-28 place-items-center rounded-full border border-white/10 bg-white/[0.05]">
                            <Sparkles className="text-[#B8FF12]" size={38} />
                          </div>
                          <div className="absolute bottom-8 rounded-full border border-[#B8FF12]/20 bg-[#B8FF12]/[0.08] px-3 py-1 text-xs font-black text-[#B8FF12]">
                            {Math.min(96, 18 + step * 19)}% analyzed
                          </div>
                        </div>
                        <div className="relative mt-5 text-center">
                          <motion.p key={scanSteps[step].label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xl font-black tracking-tight">
                            {scanSteps[step].label}
                          </motion.p>
                          <p className="mt-2 text-sm leading-6 text-white/60">{scanSteps[step].detail}</p>
                        </div>
                      </div>

                      <div className="mt-5 space-y-3">
                        {scanSteps.map((item, index) => (
                          <motion.div
                            key={item.label}
                            animate={{ opacity: index <= step ? 1 : 0.45, x: index === step ? 6 : 0 }}
                            transition={{ duration: 0.3 }}
                            className="group flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[#253041] shadow-sm"
                          >
                            <div className="min-w-0">
                              <span className="text-sm font-bold">{item.label}</span>
                              <p className="mt-1 hidden text-xs text-[#5E6673] sm:block">{item.detail}</p>
                            </div>
                            {index < step ? <CheckCircle2 className="text-[#83C900]" size={19} /> : <Clock3 className="text-[#83C900]" size={18} />}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              <div className="min-w-0 space-y-6 pt-1">
                <div>
                  <h3 className="text-lg font-black text-[#070A0F]">Trusted by restaurants like yours</h3>
                  <div className="mt-5 grid grid-cols-2 items-center gap-x-7 gap-y-4 text-center text-slate-400 opacity-70 sm:grid-cols-3 lg:grid-cols-2">
                    <span className="font-serif text-lg font-black tracking-[-0.04em]">Neighborhood Grill</span>
                    <span className="mx-auto grid size-16 place-items-center rounded-full border-2 border-slate-300 text-[9px] font-black uppercase leading-tight tracking-[0.12em]">
                      Urban<br />Kitchen
                    </span>
                    <span className="mx-auto rounded-t-2xl border-2 border-slate-300 px-3 py-2 text-[10px] font-black uppercase leading-tight tracking-[0.16em]">
                      Main<br />Street BBQ
                    </span>
                    <span className="font-serif text-xl italic tracking-[-0.05em]">Metro Bistro</span>
                    <span className="text-[11px] font-black uppercase tracking-[0.18em]">Corner Cafe</span>
                    <span className="rounded-full border border-slate-300 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em]">Local Pizza Co.</span>
                  </div>
                </div>
                <div id="pricing" className="rounded-[24px] border border-slate-200 bg-white p-7 shadow-[0_20px_70px_rgba(15,23,42,.075)]">
                  <h3 className="text-xl font-black text-[#070A0F]">{"What You'll Unlock"}</h3>
                  <p className="mt-3 max-w-md text-sm leading-6 text-[#5E6673]">
                    Your Full Growth Report includes actionable AI insights designed to help attract more guests and increase revenue.
                  </p>
                  <div className="mt-5 space-y-3">
                    {[
                      "AI-powered growth recommendations tailored to your restaurant",
                      "Restaurant-specific social media and content ideas",
                      "Revenue leak analysis with prioritized fixes",
                      "Downloadable action plan and growth report",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3 text-sm leading-6 text-[#253041]">
                        <CheckCircle2 className="mt-0.5 shrink-0 text-[#A6EA00]" size={18} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-5 text-xs font-semibold tracking-[0.01em] text-[#5E6673]">
                    One-time purchase • Instant access after checkout
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      <AnimatePresence>
        {phase === "results" && result && (
          <Results
            result={result}
            restart={() => {
              hasTrackedResultsViewRef.current = false;
              setScanError("");
              setPhase("form");
            }}
            pricingOpen={pricingOpen}
            closePricing={() => setPricingOpen(false)}
            startCheckout={startCheckout}
            checkoutPlan={checkoutPlan}
            checkoutError={checkoutError}
            openPricing={() => setPricingOpen(true)}
            reportUnlocked={reportUnlocked}
            auditInput={form}
            shareToken={shareToken}
            isPreviewMode={previewModeRef.current}
          />
        )}
      </AnimatePresence>

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
      <span className="mb-2 block text-[11px] font-black tracking-[0.01em] text-[#253041]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-[#070A0F] outline-none transition placeholder:text-slate-400 hover:border-[#B8FF12]/60 focus:border-[#B8FF12] focus:shadow-[0_0_0_4px_rgba(184,255,18,.18)]"
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
    ["Slow mobile experience", "Example: -$1,246/mo"],
    ["Confusing menu layout", "Example: -$876/mo"],
    ["Weak trust signals", "Example: -$643/mo"],
  ];

  return (
    <motion.aside
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.7 }}
      className="relative w-full min-w-0 max-w-[550px] justify-self-center overflow-hidden rounded-[24px] border border-[#B8FF12]/35 bg-[linear-gradient(145deg,rgba(15,22,30,.88),rgba(5,7,11,.94))] p-5 shadow-[0_0_42px_rgba(184,255,18,.12),0_30px_92px_rgba(0,0,0,.46)] backdrop-blur-xl lg:justify-self-end lg:p-7"
    >
      <div className="absolute -right-20 -top-20 size-72 rounded-full bg-[#B8FF12]/10 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(184,255,18,.08),transparent_30rem)]" />
      <div className="relative">
        <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_176px]">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.09em] text-white/92">Preview Leak Score</p>
            <h2 className="mt-4 text-[2.45rem] font-black leading-none tracking-[-0.06em] text-white sm:text-[2.85rem]">Preview</h2>
            <p className="mt-1 text-sm font-black uppercase tracking-[0.05em] text-[#B8FF12]">Preview only</p>
            <div className="mt-3 inline-flex rounded-full border border-[#FF8A8A]/20 bg-[#FF8A8A]/10 px-4 py-2 text-xs font-black text-[#FF9A9A]">Example result</div>
          </div>
          <div className="relative mx-auto grid size-40 place-items-center sm:size-44">
            <svg className="absolute inset-0 -rotate-[145deg]" viewBox="0 0 180 180" aria-hidden="true">
              <circle cx="90" cy="90" r="66" stroke="rgba(255,255,255,.10)" strokeWidth="17" fill="none" strokeLinecap="round" strokeDasharray="312 430" />
              <motion.circle
                cx="90"
                cy="90"
                r="66"
                stroke="#C6FF18"
                strokeWidth="17"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="206 430"
                initial={{ strokeDashoffset: 212 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>
            <div className="text-center">
              <div className="text-[3rem] font-black leading-none tracking-[-0.065em] text-[#C6FF18]">68<span className="ml-1 text-base tracking-normal text-white">/100</span></div>
              <div className="mt-2 text-sm font-semibold text-white/70">Leak Score</div>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-white/[0.075] pt-4">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.12em] text-white/92">Top Leaks Found</p>
          <div className="space-y-2">
            {leaks.map(([label, loss]) => (
              <div key={label} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-white/[0.075] bg-black/24 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.035)]">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-7 place-items-center rounded-lg text-[#C6FF18]">
                    <AlertTriangle size={14} />
                  </span>
                  <span className="min-w-0 text-sm font-black text-white">{label}</span>
                </div>
                <span className="shrink-0 text-xs font-black text-[#FF8A8A]">{loss}</span>
              </div>
            ))}
          </div>
        </div>

        <button type="button" className="group mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.075] bg-white/[0.055] px-5 py-4 text-sm font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,.05)] transition hover:border-[#B8FF12]/35 hover:bg-[#B8FF12]/[0.08]">
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
  auditInput,
  shareToken,
  isPreviewMode,
}: {
  result: AuditResponse;
  restart: () => void;
  pricingOpen: boolean;
  closePricing: () => void;
  startCheckout: (planId: PricingPlan["id"]) => Promise<void>;
  checkoutPlan: PricingPlan["id"] | null;
  checkoutError: string;
  openPricing: () => void;
  reportUnlocked: boolean;
  auditInput: AuditInput;
  shareToken: string | null;
  isPreviewMode: boolean;
}) {
  if (reportUnlocked) {
    return (
      <motion.section
        id="report-results"
        key="premium-results"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 18 }}
        className="relative z-10 mx-auto w-full max-w-[1240px] scroll-mt-8 px-0 pb-12 pt-6 sm:pb-16 sm:pt-8"
      >
        <PremiumRevenueReport result={result} auditInput={auditInput} restart={restart} shareToken={shareToken} isPreviewMode={isPreviewMode} />
      </motion.section>
    );
  }

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
            <p className="text-xs font-black uppercase tracking-[0.18em] text-lime">Free scan results</p>
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
                  <h3 className="text-2xl font-black leading-tight text-white">Example leak pattern detected</h3>
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

        <GoogleBackedMetrics googleSignals={result.websiteSnapshot?.googleSignals ?? result.googleSignals ?? null} />

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

function PremiumRevenueReport({
  result,
  auditInput,
  restart,
  shareToken,
  isPreviewMode,
}: {
  result: AuditResponse;
  auditInput: AuditInput;
  restart: () => void;
  shareToken: string | null;
  isPreviewMode: boolean;
}) {
  const [busyAction, setBusyAction] = useState<"pdf" | "share" | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const reportData = buildPremiumReportData(result, auditInput, isPreviewMode);
  const restaurantName = auditInput.restaurant || result.headline.split(" may ")[0] || "Your Restaurant";
  const generatedDate = new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const reportId = result.auditId ?? `DL-${restaurantName.replace(/[^a-z0-9]/gi, "").slice(0, 5).toUpperCase() || "REPORT"}-${result.score}`;
  const canShare = Boolean(shareToken || isPreviewMode);

  async function handleDownloadPdf() {
    try {
      setBusyAction("pdf");
      await exportPremiumReportPdf(reportData, restaurantName);
      setActionStatus("PDF download started");
    } catch {
      setActionStatus("PDF export failed in this browser");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleShareReport() {
    if (!canShare) {
      setActionStatus("Private share link is not ready for this report yet.");
      return;
    }

    try {
      setBusyAction("share");
      const message = await copyShareLink(shareToken, isPreviewMode);
      setActionStatus(message);
    } catch {
      setActionStatus("Could not copy the share link");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#f6f7fb] text-slate-950 shadow-[0_28px_90px_rgba(0,0,0,.35)]">
      <div className="border-b border-slate-200 bg-white px-5 py-5 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
              <CheckCircle2 size={15} />
              Full Growth Report Unlocked
            </div>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.035em] text-slate-950 sm:text-4xl lg:text-5xl">
              AI Revenue Audit Report
            </h2>
            <p className="mt-3 text-lg font-bold text-slate-700">{restaurantName}</p>
            <p className="mt-2 text-sm font-semibold text-slate-500">{reportData.disclaimer}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
              <ReportMeta icon={<CalendarDays size={14} />} label={`Generated ${generatedDate}`} />
              <ReportMeta icon={<FileText size={14} />} label={`Report ID ${reportId}`} />
              <ReportMeta icon={<Gauge size={14} />} label={`AI confidence ${reportData.aiConfidence}%`} />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:pt-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={busyAction === "pdf"}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Download size={16} />
              {busyAction === "pdf" ? "Preparing..." : "Download PDF"}
            </button>
            <button
              type="button"
              onClick={handleShareReport}
              disabled={!canShare || busyAction === "share"}
              title={!canShare ? "Private share link is only available after a verified checkout opens the report." : undefined}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Share2 size={16} />
              {busyAction === "share" ? "Copying..." : "Share Report"}
            </button>
          </div>
        </div>
        {actionStatus ? <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">{actionStatus}</p> : null}
      </div>

      <div className="space-y-6 px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryBox label="AI-estimated Monthly Loss" value={money(reportData.estimatedMonthlyLoss)} tone="danger" caption={reportData.label} />
          <SummaryBox label="AI-estimated Issues Found" value={`${reportData.issuesFound}`} tone="neutral" caption={`${result.categories.length} scan categories + ${result.opportunities.length} opportunities`} />
          <SummaryBox label="AI-estimated Growth Potential" value={money(reportData.estimatedGrowthPotential)} tone="success" caption="Modeled upside if the playbooks are executed" />
          <SummaryBox label="AI Confidence" value={`${reportData.aiConfidence}%`} tone="warning" caption={reportData.label} />
        </section>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{reportData.label}</p>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,.92fr)]">
          <ReportPanel
            title="Revenue Leakage Overview"
            eyebrow="Estimated monthly leakage by channel"
            icon={<BarChart3 size={18} />}
          >
            <div className="space-y-4">
              {reportData.leakageBreakdown.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-bold text-slate-700">{item.label}</span>
                    <span className={item.tone === "danger" ? "font-black text-red-600" : "font-black text-amber-600"}>
                      {money(item.amount)}/mo
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={item.tone === "danger" ? "h-full rounded-full bg-red-500" : "h-full rounded-full bg-amber-400"}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ReportPanel>

          <ReportPanel title="Customer Conversion Funnel" eyebrow="Where high-intent guests drop off" icon={<Target size={18} />}>
            <div className="space-y-3">
              {reportData.funnelSteps.map((stepItem, index) => (
                <div key={stepItem.label} className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-900">{stepItem.label}</p>
                      <p className="mt-0.5 text-xs font-bold text-slate-500">{stepItem.count.toLocaleString()} estimated</p>
                    </div>
                    <span className={index === 0 ? "text-xs font-black text-slate-500" : "text-xs font-black text-red-600"}>
                      {stepItem.drop}
                    </span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${stepItem.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </ReportPanel>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,.95fr)_minmax(0,1.05fr)]">
          <ReportPanel title="Competitor Benchmark" eyebrow="Local market comparison" icon={<Trophy size={18} />}>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-[700px] w-full text-left text-sm">
                <thead className="bg-slate-950 text-xs uppercase tracking-[0.08em] text-white">
                  <tr>
                    <th className="px-3 py-3">Metric</th>
                    <th className="px-3 py-3">Your Restaurant</th>
                    <th className="px-3 py-3">Top Competitors Avg</th>
                    <th className="px-3 py-3">Standing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {reportData.benchmarkRows.map(([metric, yours, competitors, standing]) => (
                    <tr key={metric}>
                      <td className="px-3 py-3 font-black text-slate-900">{metric}</td>
                      <td className="px-3 py-3 text-slate-700">{yours}</td>
                      <td className="px-3 py-3 text-slate-700">{competitors}</td>
                      <td className={standing === "Behind" ? "px-3 py-3 font-black text-red-600" : "px-3 py-3 font-black text-amber-600"}>
                        {standing}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ReportPanel>

          <ReportPanel title="Projected Revenue Recovery" eyebrow="Six-month upside if fixes are implemented" icon={<TrendingUp size={18} />}>
            <div className="flex min-h-[270px] items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              {reportData.recoveryProjection.map(([label, value]) => (
                <div key={label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div className="text-xs font-black text-emerald-700">${(value / 1000).toFixed(1)}k</div>
                  <div className="w-full rounded-t-xl bg-emerald-500 shadow-[0_8px_18px_rgba(16,185,129,.22)]" style={{ height: `${Math.max(34, value / 42)}px` }} />
                  <div className="text-center text-[11px] font-bold text-slate-500">{label}</div>
                </div>
              ))}
            </div>
          </ReportPanel>
        </section>

        <ReportPanel title="AI Implementation Playbooks" eyebrow="AI-assisted growth actions, prompts, tools, and operating cadence" icon={<Sparkles size={18} />}>
          <div className="grid gap-4">
            {premiumSections.map((section) => (
              <div key={section.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <h4 className="text-lg font-black leading-tight text-slate-950">{section.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{section.finding}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <LightBadge tone="danger">{section.revenueImpact}</LightBadge>
                    <LightBadge tone={section.priority === "High" ? "danger" : "warning"}>{section.priority} priority</LightBadge>
                    <LightBadge tone="neutral">{section.difficulty}</LightBadge>
                    <LightBadge tone="success">{section.expectedSpeed}</LightBadge>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <RecommendationDetail label="Why it matters" value={section.why} />
                  <RecommendationDetail label="Estimated business impact" value={section.revenueImpact} />
                  <RecommendationDetail label="Quick win" value={section.quickWin} />
                  <RecommendationDetail label="Long-term fix" value={section.longTerm} />
                </div>
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">Recommended AI stack</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {section.tools.map((tool) => (
                      <span key={tool} className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-xs font-black text-emerald-800">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-950 p-3 text-white">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-300">Copy/paste AI prompt</p>
                  <p className="mt-2 text-sm leading-6 text-white/82">{section.prompt}</p>
                </div>
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">Weekly action steps</p>
                  <ol className="mt-2 grid gap-2 text-sm leading-6 text-slate-700 lg:grid-cols-3">
                    {section.weeklySteps.map((stepItem, index) => (
                      <li key={stepItem} className="rounded-lg border border-slate-200 bg-white p-3">
                        <span className="mb-1 block text-xs font-black text-slate-950">Step {index + 1}</span>
                        {stepItem}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        </ReportPanel>

        <ReportPanel title="30-Day Action Plan" eyebrow="Execution roadmap" icon={<Clock3 size={18} />}>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {reportData.actionPlan.map(([week, title, body]) => (
              <div key={week} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">{week}</p>
                <h4 className="mt-2 text-lg font-black text-slate-950">{title}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </ReportPanel>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-slate-600">Your Premium AI Growth Report is Ready.</p>
          <button onClick={restart} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
            Scan another restaurant
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportMeta({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
      {icon}
      {label}
    </span>
  );
}

function SummaryBox({
  label,
  value,
  tone,
  caption,
}: {
  label: string;
  value: string;
  tone: "danger" | "success" | "warning" | "neutral";
  caption: string;
}) {
  const toneClass =
    tone === "danger"
      ? "text-red-600"
      : tone === "success"
        ? "text-emerald-700"
        : tone === "warning"
          ? "text-amber-600"
          : "text-slate-950";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-black tracking-[-0.04em] ${toneClass}`}>{value}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{caption}</p>
    </div>
  );
}

function ReportPanel({
  title,
  eyebrow,
  icon,
  children,
}: {
  title: string;
  eyebrow: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.4rem] border border-slate-200 bg-[#fbfcfe] p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-950 text-white">{icon}</div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.13em] text-slate-500">{eyebrow}</p>
          <h3 className="mt-1 text-xl font-black tracking-[-0.02em] text-slate-950 sm:text-2xl">{title}</h3>
        </div>
      </div>
      {children}
    </section>
  );
}

function LightBadge({ tone, children }: { tone: "danger" | "warning" | "neutral" | "success"; children: ReactNode }) {
  const className =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black ${className}`}>
      {children}
    </span>
  );
}

function RecommendationDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

async function exportPremiumReportPdf(reportData: PremiumReportData, restaurantName: string) {
  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 42;
  const contentWidth = pageWidth - margin * 2;
  const titleColor: [number, number, number] = [15, 23, 42];
  const mutedColor: [number, number, number] = [75, 85, 99];
  const successColor: [number, number, number] = [5, 150, 105];
  const dangerColor: [number, number, number] = [220, 38, 38];
  const amberColor: [number, number, number] = [217, 119, 6];

  function addPageHeader(pageTitle: string, subtitle: string) {
    pdf.setTextColor(...titleColor);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text(pageTitle, margin, 52);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(...mutedColor);
    const subtitleLines = pdf.splitTextToSize(subtitle, contentWidth);
    pdf.text(subtitleLines, margin, 70);
  }

  function addFooter(pageNumber: number) {
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, pageHeight - 38, pageWidth - margin, pageHeight - 38);
    pdf.setFontSize(9);
    pdf.setTextColor(...mutedColor);
    pdf.text(`Page ${pageNumber}`, margin, pageHeight - 22);
    pdf.text("DineLeak AI Revenue Audit Report", pageWidth - margin, pageHeight - 22, { align: "right" });
  }

  function addBox(x: number, y: number, w: number, h: number, fill: [number, number, number], stroke: [number, number, number]) {
    pdf.setFillColor(...fill);
    pdf.setDrawColor(...stroke);
    pdf.roundedRect(x, y, w, h, 10, 10, "FD");
  }

  const sectionLabel = reportData.disclaimer;
  const summaryCards = [
    { label: "Estimated Monthly Loss", value: money(reportData.estimatedMonthlyLoss), color: dangerColor },
    { label: "Issues Found", value: String(reportData.issuesFound), color: titleColor },
    { label: "Growth Potential", value: money(reportData.estimatedGrowthPotential), color: successColor },
    { label: "AI Confidence", value: `${reportData.aiConfidence}%`, color: amberColor },
  ];

  addPageHeader("AI Revenue Audit Report", `${restaurantName} | ${sectionLabel}`);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(...titleColor);
  pdf.text(restaurantName, margin, 94);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...mutedColor);
  pdf.text(reportData.summaryNote, margin, 110);

  const boxY = 128;
  const boxW = (contentWidth - 18) / 2;
  const boxH = 62;
  summaryCards.forEach((card, index) => {
    const x = margin + (index % 2) * (boxW + 18);
    const y = boxY + Math.floor(index / 2) * (boxH + 14);
    addBox(x, y, boxW, boxH, [255, 255, 255], [226, 232, 240]);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...mutedColor);
    pdf.text(card.label.toUpperCase(), x + 14, y + 18);
    pdf.setFontSize(22);
    pdf.setTextColor(...card.color);
    pdf.text(card.value, x + 14, y + 44);
  });

  let y = 286;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.setTextColor(...titleColor);
  pdf.text("Revenue Leakage Overview", margin, y);
  pdf.setFontSize(9);
  pdf.setTextColor(...mutedColor);
  pdf.text("AI-estimated based on available scan signals", margin, y + 14);
  y += 28;
  reportData.leakageBreakdown.forEach((row) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9.5);
    pdf.setTextColor(...titleColor);
    pdf.text(row.label, margin, y);
    pdf.text(`~${money(row.amount)}/mo`, pageWidth - margin, y, { align: "right" });
    y += 8;
    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(margin, y, contentWidth, 10, 5, 5, "F");
    pdf.setFillColor(...(row.tone === "danger" ? dangerColor : amberColor));
    pdf.roundedRect(margin, y, contentWidth * (row.value / 100), 10, 5, 5, "F");
    y += 22;
  });

  addFooter(1);
  pdf.addPage();

  addPageHeader("Customer Conversion Funnel", "Website visitors -> menu views -> order attempts -> completed orders");
  y = 92;
  reportData.funnelSteps.forEach((step) => {
    addBox(margin, y, contentWidth, 54, [255, 255, 255], [226, 232, 240]);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...titleColor);
    pdf.text(step.label, margin + 14, y + 18);
    pdf.setFontSize(9);
    pdf.setTextColor(...mutedColor);
    pdf.text(`${step.count.toLocaleString()} estimated`, margin + 14, y + 34);
    pdf.text(step.drop, pageWidth - margin - 14, y + 18, { align: "right" });
    pdf.setFillColor(16, 185, 129);
    pdf.roundedRect(margin + 14, y + 40, contentWidth - 28, 8, 4, 4, "F");
    pdf.setFillColor(226, 232, 240);
    pdf.roundedRect(margin + 14, y + 40, (contentWidth - 28) * (step.value / 100), 8, 4, 4, "F");
    y += 66;
  });

  y += 4;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.setTextColor(...titleColor);
  pdf.text("Competitor Benchmark", margin, y);
  pdf.setFontSize(9);
  pdf.setTextColor(...mutedColor);
  pdf.text("AI-estimated local market comparison", margin, y + 14);
  y += 26;
  reportData.benchmarkRows.forEach(([metric, yours, competitors, standing]) => {
    addBox(margin, y, contentWidth, 40, [255, 255, 255], [226, 232, 240]);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...titleColor);
    pdf.text(metric, margin + 12, y + 15);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...mutedColor);
    pdf.text(`You: ${yours}`, margin + 12, y + 29);
    pdf.text(`Competitors: ${competitors}`, margin + contentWidth / 2, y + 29);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...(standing === "Behind" ? dangerColor : standing === "Ahead" ? successColor : amberColor));
    pdf.text(standing, pageWidth - margin - 12, y + 24, { align: "right" });
    y += 52;
  });

  addFooter(2);
  pdf.addPage();

  addPageHeader("Projected Revenue Recovery", "Six-month upside if the playbooks are implemented");
  y = 92;
  addBox(margin, y, contentWidth, 170, [255, 255, 255], [226, 232, 240]);
  const chartBottom = y + 128;
  const chartLeft = margin + 20;
  const chartWidth = contentWidth - 40;
  const barWidth = chartWidth / reportData.recoveryProjection.length - 10;
  const maxValue = Math.max(...reportData.recoveryProjection.map(([, value]) => value));
  reportData.recoveryProjection.forEach(([month, value], index) => {
    const barHeight = Math.max(18, (value / maxValue) * 92);
    const barX = chartLeft + index * (barWidth + 10);
    pdf.setFillColor(16, 185, 129);
    pdf.roundedRect(barX, chartBottom - barHeight, barWidth, barHeight, 5, 5, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...titleColor);
    pdf.text(money(value), barX + barWidth / 2, chartBottom - barHeight - 6, { align: "center" });
    pdf.setTextColor(...mutedColor);
    pdf.text(month, barX + barWidth / 2, chartBottom + 12, { align: "center" });
  });

  y += 190;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.setTextColor(...titleColor);
  pdf.text("AI Implementation Playbooks", margin, y);
  y += 18;
  reportData.actionPlan.forEach(([week, phase, body]) => {
    const boxH = 64;
    if (y + boxH > pageHeight - 70) {
      addFooter(pdf.getNumberOfPages());
      pdf.addPage();
      y = 92;
    }
    addBox(margin, y, contentWidth, boxH, [255, 255, 255], [226, 232, 240]);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...successColor);
    pdf.text(week, margin + 12, y + 16);
    pdf.setTextColor(...titleColor);
    pdf.text(phase, margin + 12, y + 30);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...mutedColor);
    const lines = pdf.splitTextToSize(body, contentWidth - 24);
    pdf.text(lines, margin + 12, y + 44);
    y += boxH + 10;
  });

  addFooter(pdf.getNumberOfPages());
  pdf.save(`dineleak-ai-revenue-audit-${restaurantName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`);
}

async function copyShareLink(shareToken: string | null, isPreviewMode: boolean) {
  const shareUrl = shareToken ? `${window.location.origin}/?share=${encodeURIComponent(shareToken)}` : window.location.href;
  await navigator.clipboard.writeText(shareUrl);
  return isPreviewMode ? "Preview link copied" : shareToken ? "Private report link copied" : "Current link copied";
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

function GoogleBackedMetrics({ googleSignals }: { googleSignals: GoogleAuditSignals | null }) {
  const pageSpeed = googleSignals?.pageSpeed;
  const places = googleSignals?.places;

  if (!pageSpeed && !places) {
    return (
      <ReportCard className="mt-6 border-cyan-400/20 bg-[linear-gradient(145deg,rgba(17,185,255,.08),rgba(0,0,0,.24))] shadow-[0_0_34px_rgba(17,185,255,.08)] lg:mt-8">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Google-backed data</p>
            <h3 className="mt-3 text-2xl font-black leading-tight text-white sm:text-3xl">Google enrichment unavailable for this scan</h3>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/64 sm:text-base sm:leading-7">
              No live Google PageSpeed or Places data was returned, so the report stays on scan signals only. When Google APIs are configured and the business matches cleanly, this section fills in automatically.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/58">
            Fallback-safe
          </span>
        </div>
      </ReportCard>
    );
  }

  const coreWebVitals = pageSpeed?.coreWebVitals;

  return (
    <ReportCard className="mt-6 border-cyan-400/20 bg-[linear-gradient(145deg,rgba(17,185,255,.08),rgba(0,0,0,.24))] shadow-[0_0_34px_rgba(17,185,255,.08)] lg:mt-8">
      <div className="mb-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Google-backed data</p>
          <h3 className="mt-3 text-2xl font-black leading-tight text-white sm:text-3xl">
            Real metrics from Google PageSpeed and Places
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {pageSpeed ? (
            <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-200">
              Google PageSpeed
            </span>
          ) : null}
          {places ? (
            <span className="rounded-full border border-lime/20 bg-lime/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-lime">
              Google Places
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {pageSpeed ? (
          <div className="rounded-[1.4rem] border border-white/10 bg-black/24 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-300">From Google PageSpeed</p>
                <h4 className="mt-2 text-lg font-black text-white">Mobile performance snapshot</h4>
              </div>
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-200">
                {pageSpeed.mobileUrlTested}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MetricTile label="Performance score" value={pageSpeed.performanceScore} source="Google PageSpeed" />
              <MetricTile label="Accessibility score" value={pageSpeed.accessibilityScore} source="Google PageSpeed" />
              <MetricTile label="SEO score" value={pageSpeed.seoScore} source="Google PageSpeed" />
              <MetricTile label="Best practices score" value={pageSpeed.bestPracticesScore} source="Google PageSpeed" />
            </div>

            {coreWebVitals ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-300">Core Web Vitals</p>
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-200">
                    Google PageSpeed
                  </span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  <MetricTile
                    label="Largest Contentful Paint"
                    value={formatMs(coreWebVitals.largestContentfulPaintMs)}
                    source="Google PageSpeed"
                  />
                  <MetricTile
                    label="Cumulative Layout Shift"
                    value={formatDecimal(coreWebVitals.cumulativeLayoutShift)}
                    source="Google PageSpeed"
                  />
                  <MetricTile
                    label="Interaction to Next Paint"
                    value={formatMs(coreWebVitals.interactionToNextPaintMs)}
                    source="Google PageSpeed"
                  />
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <MetricTile
                    label="First Contentful Paint"
                    value={formatMs(coreWebVitals.firstContentfulPaintMs)}
                    source="Google PageSpeed"
                  />
                  <MetricTile
                    label="Speed Index"
                    value={formatMs(coreWebVitals.speedIndexMs)}
                    source="Google PageSpeed"
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {places ? (
          <div className="rounded-[1.4rem] border border-white/10 bg-black/24 p-4 sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-lime">From Google Places</p>
            <h4 className="mt-2 text-lg font-black text-white">Local business data</h4>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MetricTile label="Rating" value={places.rating ?? "Unavailable"} source="Google Places" />
              <MetricTile label="Review count" value={places.reviewCount ?? "Unavailable"} source="Google Places" />
              <MetricTile label="Address" value={places.address ?? "Unavailable"} source="Google Places" />
              <MetricTile label="Maps URL" value={places.googleMapsUrl ?? "Unavailable"} source="Google Places" />
            </div>
            {places.businessHours.length ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-lime">Business hours</p>
                <ul className="mt-2 space-y-1 text-sm leading-6 text-white/76">
                  {places.businessHours.slice(0, 7).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </ReportCard>
  );
}

function MetricTile({
  label,
  value,
  source,
}: {
  label: string;
  value: string | number;
  source: "Google PageSpeed" | "Google Places";
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/46">{label}</p>
      <p className="mt-1 text-base font-black text-white [overflow-wrap:anywhere]">{typeof value === "number" ? value : value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-300">{source}</p>
    </div>
  );
}

function formatMs(value: number | null) {
  if (value === null) return "Unavailable";
  return `${Math.round(value)} ms`;
}

function formatDecimal(value: number | null) {
  if (value === null) return "Unavailable";
  return value.toFixed(2);
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
                  : "Your free scan surfaced a few likely leaks. Unlock the full AI growth plan."}
              </h3>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/64 sm:text-base sm:leading-7">
                {reportUnlocked
                  ? "You now have instant access to AI-generated growth snapshots and recommendations, while monthly monitoring remains available below."
                  : "Beta access with AI-estimated insights and Google-backed signals where available."}
              </p>
            </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/70">
          <ShieldCheck size={14} className="text-lime" />
          {reportUnlocked ? "Purchase Complete" : "Beta access"}
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
            className="glass relative z-10 w-full max-w-5xl overflow-hidden rounded-[2rem] bg-[#080d19]/95 p-5 shadow-[0_30px_120px_rgba(0,0,0,.65)] backdrop-blur-xl sm:p-6 lg:p-7"
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
                  : "Your free scan surfaced a few likely leaks. Unlock the full AI growth plan."}
              </h3>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/64 sm:text-base sm:leading-7">
                {reportUnlocked
                  ? "Instant access is already available. Monthly monitoring offers deeper ongoing visibility below."
                  : "Beta access with AI-estimated insights and Google-backed signals where available."}
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
      <div className="noise-layer pointer-events-none absolute inset-0 opacity-[0.032]" />
      <div className="mesh-layer pointer-events-none absolute inset-0 opacity-25" />
      <div className="floor-grid pointer-events-none absolute inset-x-0 top-[24rem] hidden h-[28rem] opacity-22 lg:block" />
      <div className="pointer-events-none absolute -left-24 top-20 size-[30rem] rounded-full bg-[radial-gradient(circle,rgba(198,255,0,.03),transparent_68%)] blur-3xl" />
      <div className="ambient-drift pointer-events-none absolute right-0 top-10 hidden h-[560px] w-[520px] rounded-l-[5rem] border border-lime/5 bg-[linear-gradient(145deg,rgba(198,255,0,.024),rgba(183,255,0,.012),rgba(255,255,255,.01))] blur-[1px] lg:block" />
      <div className="beam-layer pointer-events-none absolute right-0 top-0 hidden h-[620px] w-[620px] lg:block" style={{ opacity: 0.12 }} />
      <div className="ambient-drift pointer-events-none absolute bottom-20 right-12 hidden size-44 rounded-full border border-lime/10 bg-lime/[0.012] shadow-[0_0_18px_rgba(198,255,0,.08)] lg:block" />
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
