import type { AuditResult } from "@/lib/audit";

const REPORT_RESULT_KEY = "dineleak-report-result";
const REPORT_UNLOCK_KEY = "dineleak-report-unlocked";
const REPORT_UNLOCK_SESSION_KEY = "dineleak-report-unlock-session";
const REPORT_SHARE_TOKEN_KEY = "dineleak-report-share-token";

function isBrowser() {
  return typeof window !== "undefined";
}

function notifyReportUnlockChange() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event("dineleak-report-unlock"));
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

export function setReportUnlocked(unlocked: boolean, sessionId?: string | null) {
  if (!isBrowser()) return;
  if (!unlocked) {
    window.localStorage.removeItem(REPORT_UNLOCK_KEY);
    window.localStorage.removeItem(REPORT_UNLOCK_SESSION_KEY);
    notifyReportUnlockChange();
    return;
  }

  if (sessionId?.trim()) {
    window.localStorage.setItem(REPORT_UNLOCK_SESSION_KEY, sessionId.trim());
  }

  window.localStorage.setItem(REPORT_UNLOCK_KEY, unlocked ? "1" : "0");
  notifyReportUnlockChange();
}

export function isReportUnlocked() {
  if (!isBrowser()) return false;
  return window.localStorage.getItem(REPORT_UNLOCK_KEY) === "1" || Boolean(window.localStorage.getItem(REPORT_UNLOCK_SESSION_KEY));
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
