export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID?.trim() || "G-C721TTVCTF";

export function isGoogleAnalyticsEnabled() {
  return Boolean(GA_MEASUREMENT_ID);
}

type AnalyticsEventParams = Record<string, string | number | boolean | undefined>;

export function trackGaEvent(eventName: string, params: AnalyticsEventParams = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function" || !isGoogleAnalyticsEnabled()) return;
  window.gtag("event", eventName, params);
}
