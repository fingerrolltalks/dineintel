import type { AuditResult } from "@/lib/audit";

const REPORT_RESULT_KEY = "dineleak-report-result";
const REPORT_UNLOCK_KEY = "dineleak-report-unlocked";
const REPORT_SHARE_TOKEN_KEY = "dineleak-report-share-token";

function isBrowser() {
  return typeof window !== "undefined";
}

export function saveReportResult(result: AuditResult) {
  if (!isBrowser()) return;
  window.localStorage.setItem(REPORT_RESULT_KEY, JSON.stringify(result));
}

export function loadReportResult() {
  if (!isBrowser()) return null;

  const raw = window.localStorage.getItem(REPORT_RESULT_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuditResult;
  } catch {
    return null;
  }
}

export function setReportUnlocked(unlocked: boolean) {
  if (!isBrowser()) return;
  window.localStorage.setItem(REPORT_UNLOCK_KEY, unlocked ? "1" : "0");
}

export function isReportUnlocked() {
  if (!isBrowser()) return false;
  return window.localStorage.getItem(REPORT_UNLOCK_KEY) === "1";
}

export function saveReportShareToken(token: string | null) {
  if (!isBrowser()) return;
  if (!token) {
    window.localStorage.removeItem(REPORT_SHARE_TOKEN_KEY);
    return;
  }
  window.localStorage.setItem(REPORT_SHARE_TOKEN_KEY, token);
}

export function loadReportShareToken() {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(REPORT_SHARE_TOKEN_KEY);
}
