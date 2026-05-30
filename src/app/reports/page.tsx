"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { FormEvent } from "react";

type ReportItem = {
  restaurantName: string;
  website: string;
  createdAt: string;
  status: string | null;
  score: number | null;
  scanType: string;
  headline: string | null;
  topIssues: string[];
  topRecommendations: string[];
};

type ReportsLookupResponse = {
  found: boolean;
  customerEmail?: string;
  subscription?: {
    active: boolean;
    stripeStatus: string | null;
    intervalDays: number | null;
    nextScanAt: string | null;
    lastScanAt: string | null;
    scanCount: number;
    productType: "starter" | "pro" | null;
  } | null;
  reports: ReportItem[];
  message?: string | null;
  retryAfterSeconds?: number;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export default function ReportsPage() {
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [data, setData] = useState<ReportsLookupResponse | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, []);

  const selectedReport = useMemo(() => data?.reports?.[selectedIndex] ?? null, [data, selectedIndex]);

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      setError("Enter the email used at checkout.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/reports/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const body = (await response.json()) as ReportsLookupResponse;
      if (!response.ok) {
        setData(null);
        setMessage(body.message ?? "We could not look up reports right now.");
        return;
      }

      setData(body);
      setSelectedIndex(0);
      setMessage(body.message ?? "");
      window.setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    } catch {
      setError("We couldn’t look up reports right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function downloadPdf(report: ReportItem) {
    const pdf = new jsPDF({ unit: "pt", format: "letter" });
    const marginX = 54;
    let y = 56;

    pdf.setTextColor(8, 10, 15);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.text("DineLeak Monitor Report", marginX, y);
    y += 20;

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Restaurant: ${report.restaurantName}`, marginX, y);
    y += 18;
    pdf.text(`Website: ${report.website}`, marginX, y);
    y += 18;
    pdf.text(`Scan date: ${formatDate(report.createdAt)}`, marginX, y);
    y += 18;
    pdf.text(`Leak score: ${report.score ?? "N/A"}`, marginX, y);
    y += 24;

    pdf.setFont("helvetica", "bold");
    pdf.text("Headline", marginX, y);
    y += 16;
    pdf.setFont("helvetica", "normal");
    const headline = report.headline ?? "Monitoring summary generated from your latest scan.";
    const headlineLines = pdf.splitTextToSize(headline, 500) as string[];
    pdf.text(headlineLines, marginX, y);
    y += headlineLines.length * 14 + 10;

    if (report.topIssues.length) {
      pdf.setFont("helvetica", "bold");
      pdf.text("Top issues", marginX, y);
      y += 16;
      pdf.setFont("helvetica", "normal");
      report.topIssues.forEach((issue) => {
        const lines = pdf.splitTextToSize(`• ${issue}`, 500) as string[];
        pdf.text(lines, marginX, y);
        y += lines.length * 14;
      });
      y += 6;
    }

    if (report.topRecommendations.length) {
      pdf.setFont("helvetica", "bold");
      pdf.text("Top recommendations", marginX, y);
      y += 16;
      pdf.setFont("helvetica", "normal");
      report.topRecommendations.forEach((recommendation) => {
        const lines = pdf.splitTextToSize(`• ${recommendation}`, 500) as string[];
        pdf.text(lines, marginX, y);
        y += lines.length * 14;
      });
    }

    pdf.setFontSize(10);
    pdf.setTextColor(95, 102, 115);
    pdf.text("Generated by DineLeak from your stored monitoring report data.", marginX, 740);
    pdf.save(`dineleak-monitor-${report.restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(198,255,0,.10),_transparent_35%),linear-gradient(180deg,#05070B_0%,#080D12_28%,#F7F8FA_28%,#F7F8FA_100%)] px-4 py-8 text-white antialiased sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="glass rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-lime">DineLeak Monitor</p>
              <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">View Your DineLeak Reports</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
                Enter the email used at checkout to view your monitoring reports.
              </p>
              <p className="mt-3 text-sm leading-7 text-white/58">No password needed. Use the same email from your DineLeak Monitor subscription.</p>
            </div>
            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4 text-sm text-white/74 lg:min-w-[290px]">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-lime">What you’ll get</p>
              <ul className="mt-3 space-y-2 leading-6">
                <li>• Monthly AI scans and saved report history</li>
                <li>• Restaurant website, reputation, and visibility tracking</li>
                <li>• Downloadable reports with no password needed</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
          <form onSubmit={handleLookup} className="glass rounded-[1.8rem] p-5 text-left shadow-[0_20px_80px_rgba(0,0,0,.24)] sm:p-6">
            <label htmlFor="reports-email" className="text-xs font-black uppercase tracking-[0.18em] text-lime">
              Email address
            </label>
            <input
              id="reports-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@restaurant.com"
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-ink outline-none transition placeholder:text-slate-400 focus:border-lime focus:ring-2 focus:ring-lime/30"
            />
            <button
              type="submit"
              disabled={loading}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#D7FF2F,#A7FF00)] px-5 py-4 text-sm font-black uppercase text-ink shadow-[0_0_42px_rgba(198,255,0,.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              View My Reports
            </button>
            {error ? <p className="mt-3 text-sm font-medium text-[#FF8A8A]">{error}</p> : null}
            {message && !error ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
          </form>

          <div className="glass rounded-[1.8rem] p-5 text-left shadow-[0_20px_80px_rgba(0,0,0,.18)] sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-lime">Lookup result</p>
                <h2 className="mt-2 text-2xl font-black text-ink">Customer report access</h2>
              </div>
              <div className="grid size-12 place-items-center rounded-2xl bg-lime/15 text-lime">
                <ShieldCheck size={20} />
              </div>
            </div>

            {!data ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
                View your monitoring reports here after checkout. If you haven’t subscribed yet, your reports will show up after your first scan completes.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Customer email</p>
                  <p className="mt-2 text-sm font-semibold text-ink">{data.customerEmail}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <Stat label="Status" value={data.subscription?.active ? "Active" : data.subscription?.stripeStatus ?? "Unknown"} />
                    <Stat label="Reports found" value={String(data.reports.length)} />
                    <Stat label="Frequency" value={data.subscription?.intervalDays === 7 ? "Every 7 days" : "Every 30 days"} />
                  </div>
                </div>

                {data.reports.length ? (
                  <div className="space-y-3">
                    {data.reports.map((report, index) => {
                      const isSelected = selectedIndex === index;
                      return (
                        <div
                          key={`${report.restaurantName}-${report.createdAt}-${index}`}
                          className={`rounded-2xl border p-4 transition ${isSelected ? "border-lime/40 bg-lime/[0.06]" : "border-slate-200 bg-white"}`}
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-lg font-black text-ink">{report.restaurantName}</p>
                              <p className="mt-1 truncate text-sm text-slate-600">{report.website}</p>
                              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">{formatDate(report.createdAt)}</span>
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">{report.scanType === "recurring" ? "Recurring scan" : "One-time scan"}</span>
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">{report.status}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Leak score</p>
                                <p className="mt-1 text-2xl font-black text-ink">{report.score ?? "—"}</p>
                              </div>
                            </div>
                          </div>

                          {report.headline ? <p className="mt-4 text-sm leading-7 text-slate-700">{report.headline}</p> : null}

                          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedIndex(index);
                                resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                              }}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#D7FF2F,#A7FF00)] px-4 py-3 text-sm font-black uppercase text-ink transition hover:-translate-y-0.5"
                            >
                              <FileText size={16} />
                              View Report
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadPdf(report)}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black uppercase text-ink transition hover:border-lime/40 hover:bg-lime/[0.05]"
                            >
                              <Download size={16} />
                              Download PDF
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>

        {selectedReport ? (
          <section ref={resultsRef} className="glass rounded-[2rem] p-6 text-left sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-lime">Selected report</p>
                <h2 className="mt-2 text-2xl font-black text-white">{selectedReport.restaurantName}</h2>
                <p className="mt-2 text-sm text-white/68">{selectedReport.website}</p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <Sparkles size={16} className="text-lime" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">Leak score</p>
                  <p className="text-lg font-black text-white">{selectedReport.score ?? "—"}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
              <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-lime">Summary</p>
                <p className="mt-3 text-base leading-8 text-white/80">
                  {selectedReport.headline ?? "Your latest monitoring report is ready."}
                </p>
                {selectedReport.topIssues.length ? (
                  <div className="mt-5 space-y-3">
                    {selectedReport.topIssues.map((issue) => (
                      <div key={issue} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-white/78">
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-lime" />
                        <span>{issue}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-lime">Recommendations</p>
                {selectedReport.topRecommendations.length ? (
                  <div className="mt-4 space-y-3">
                    {selectedReport.topRecommendations.map((recommendation) => (
                      <div key={recommendation} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/78">
                        {recommendation}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-7 text-white/68">Your report summary is available above. More recommendations will appear after each scan.</p>
                )}

                <div className="mt-5 rounded-2xl border border-lime/15 bg-lime/[0.06] p-4 text-sm leading-7 text-white/78">
                  Saved with your subscription • Accessible by email lookup
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="flex flex-col items-center gap-3 rounded-[2rem] border border-white/10 bg-white/[0.04] px-6 py-6 text-center text-white/90 sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-lime">Need a fresh scan?</p>
            <p className="mt-2 text-sm text-white/68">Go back to DineLeak to run a new free leak scan.</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#D7FF2F,#A7FF00)] px-5 py-4 text-sm font-black uppercase text-ink transition hover:-translate-y-0.5"
          >
            Back to homepage
            <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
