import type { AuditResult, AuditScoreTrend } from "@/lib/audit";

type MonitoringKey = "visibility" | "trust" | "conversion" | "socialPresence" | "menuOrdering";

function clampScore(value: number) {
  return Math.max(48, Math.min(91, Math.round(value)));
}

function getCategoryScore(result: AuditResult | null | undefined, key: MonitoringKey) {
  if (!result) return 0;

  if (result.scores) {
    return clampScore(result.scores[key] ?? 0);
  }

  const categoryName = {
    visibility: "Visibility",
    trust: "Reputation",
    conversion: "Conversion",
    socialPresence: "Social",
    menuOrdering: "Conversion",
  }[key];

  return clampScore(result.categories.find((category) => category.name === categoryName)?.score ?? 0);
}

function buildTrend(previous: AuditResult | null | undefined, current: AuditResult, key: MonitoringKey): AuditScoreTrend {
  const previousScore = getCategoryScore(previous, key) || getCategoryScore(current, key);
  const currentScore = getCategoryScore(current, key);
  return {
    previous: previousScore,
    current: currentScore,
    delta: currentScore - previousScore,
  };
}

export function buildMonitoringSummary(previous: AuditResult | null, current: AuditResult) {
  const scoreChanges = {
    visibility: buildTrend(previous, current, "visibility"),
    trust: buildTrend(previous, current, "trust"),
    conversion: buildTrend(previous, current, "conversion"),
    socialPresence: buildTrend(previous, current, "socialPresence"),
    menuOrdering: buildTrend(previous, current, "menuOrdering"),
  };

  const whatImproved: string[] = [];
  for (const [key, trend] of Object.entries(scoreChanges) as [keyof typeof scoreChanges, AuditScoreTrend][]) {
    if (trend.delta <= 0) continue;

    const label =
      key === "socialPresence"
        ? "Social presence"
        : key === "menuOrdering"
          ? "Menu ordering"
          : key.charAt(0).toUpperCase() + key.slice(1);

    whatImproved.push(`${label} improved by ${trend.delta} points (${trend.previous} → ${trend.current}).`);
  }

  const previousTitles = new Set((previous?.opportunities ?? []).map((item) => item.title.trim().toLowerCase()));
  const newIssuesFound: string[] = current.opportunities
    .filter((item) => !previousTitles.has(item.title.trim().toLowerCase()))
    .slice(0, 3)
    .map((item) => item.title);

  if (!whatImproved.length) {
    whatImproved.push("No major score gains yet, but the new scan established a fresh baseline.");
  }

  if (!newIssuesFound.length) {
    newIssuesFound.push("No brand-new issue titles appeared in this run.");
  }

  return {
    previousAuditId: null as string | null,
    scanType: "recurring" as const,
    monitoringPlan: null as "starter" | "pro" | null,
    whatImproved,
    newIssuesFound,
    scoreChanges,
  };
}
