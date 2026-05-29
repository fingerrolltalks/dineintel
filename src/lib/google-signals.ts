import type { AuditInput } from "@/lib/audit";
import { getSql } from "@/lib/database";
import { ensureDineLeakDatabaseSchema } from "@/lib/database-schema";

export type GooglePageSpeedSignals = {
  mobileUrlTested: string;
  performanceScore: number;
  accessibilityScore: number;
  seoScore: number;
  bestPracticesScore: number;
  coreWebVitals: {
    largestContentfulPaintMs: number | null;
    cumulativeLayoutShift: number | null;
    interactionToNextPaintMs: number | null;
    firstContentfulPaintMs: number | null;
    speedIndexMs: number | null;
    overallCategory: string | null;
  } | null;
  fetchedAt: string;
};

export type GooglePlacesSignals = {
  placeName: string | null;
  rating: number | null;
  reviewCount: number | null;
  address: string | null;
  businessHours: string[];
  googleMapsUrl: string | null;
  fetchedAt: string;
};

export type GoogleAuditSignals = {
  pageSpeed: GooglePageSpeedSignals | null;
  places: GooglePlacesSignals | null;
};

type GoogleErrorKind = "missing_env" | "quota" | "invalid_key" | "bad_request" | "timeout" | "network" | "upstream";

type GoogleResponseError = {
  code?: number;
  status?: string;
  message?: string;
  details?: Array<{ reason?: string; message?: string }>;
};

type CacheRecord<T> = {
  payload: T;
  expiresAt: string;
};

declare global {
  var __dineleakGoogleSignalCache: Map<string, CacheRecord<unknown>> | undefined;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RETRIES = 1;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function normalizeUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();
  return trimmed.match(/^https?:\/\//i) ? trimmed : `https://${trimmed}`;
}

function getUrlScope(rawUrl: string) {
  try {
    return new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return rawUrl.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0] || "unknown";
  }
}

function toScore(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return value <= 1 ? Math.round(value * 100) : Math.round(value);
}

function logMissingKey(label: string) {
  console.warn(`[dineleak] ${label} api key missing`, {
    deploymentEnv: process.env.VERCEL_ENV ?? "unknown",
  });
}

function readBooleanEnv(name: string, defaultValue = true) {
  const raw = process.env[name]?.trim();
  if (!raw) return defaultValue;
  return !["false", "0", "off", "no"].includes(raw.toLowerCase());
}

function readIntEnv(name: string, defaultValue: number) {
  const raw = process.env[name]?.trim();
  if (!raw) return defaultValue;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

function getGoogleConfig() {
  return {
    enabled: readBooleanEnv("GOOGLE_ENRICHMENT_ENABLED", true),
    pageSpeedEnabled: readBooleanEnv("PAGESPEED_ENABLED", true),
    placesEnabled: readBooleanEnv("PLACES_ENABLED", true),
    timeoutMs: readIntEnv("GOOGLE_API_TIMEOUT_MS", DEFAULT_TIMEOUT_MS),
    maxRetries: Math.max(0, readIntEnv("GOOGLE_API_MAX_RETRIES", DEFAULT_MAX_RETRIES)),
  };
}

function isGoogleEnabled() {
  return getGoogleConfig().enabled;
}

function getCacheKey(type: "pagespeed" | "places", scope: string) {
  const version = type === "pagespeed" ? "v2" : "v1";
  return `${type}:${version}:${scope}`;
}

function getMemoryCache<T>(key: string): CacheRecord<T> | null {
  const record = globalThis.__dineleakGoogleSignalCache?.get(key);
  if (!record) return null;
  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    globalThis.__dineleakGoogleSignalCache?.delete(key);
    return null;
  }
  return record as CacheRecord<T>;
}

async function readCachedSignal<T>(cacheKey: string) {
  try {
    const memoryRecord = getMemoryCache<T>(cacheKey);
    if (memoryRecord) {
      return memoryRecord.payload;
    }

    const sql = getSql();
    if (!sql) return null;

    await ensureDineLeakDatabaseSchema();
    const [row] = await sql`
      SELECT payload_json, expires_at
      FROM dineintel_google_signal_cache
      WHERE cache_key = ${cacheKey}
        AND expires_at > NOW()
      LIMIT 1
    `;

    if (!row) {
      return null;
    }

    const payload = row.payload_json as T;
    const expiresAt = row.expires_at as string;
    globalThis.__dineleakGoogleSignalCache ??= new Map<string, CacheRecord<unknown>>();
    globalThis.__dineleakGoogleSignalCache.set(cacheKey, { payload, expiresAt });
    return payload;
  } catch (error) {
    console.warn("[dineleak] google cache read failed", {
      cacheKey,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function writeCachedSignal<T>(cacheKey: string, cacheType: "pagespeed" | "places", cacheScope: string, payload: T) {
  const expiresAt = new Date(Date.now() + CACHE_TTL_MS).toISOString();
  globalThis.__dineleakGoogleSignalCache ??= new Map<string, CacheRecord<unknown>>();
  globalThis.__dineleakGoogleSignalCache.set(cacheKey, { payload, expiresAt });

  const sql = getSql();
  if (!sql) return;

  try {
    await ensureDineLeakDatabaseSchema();
    await sql`
      INSERT INTO dineintel_google_signal_cache (
        cache_key,
        cache_type,
        cache_scope,
        payload_json,
        expires_at,
        created_at,
        updated_at
      )
      VALUES (
        ${cacheKey},
        ${cacheType},
        ${cacheScope},
        ${JSON.stringify(payload)},
        ${expiresAt},
        NOW(),
        NOW()
      )
      ON CONFLICT (cache_key) DO UPDATE SET
        cache_type = EXCLUDED.cache_type,
        cache_scope = EXCLUDED.cache_scope,
        payload_json = EXCLUDED.payload_json,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW()
    `;
  } catch (error) {
    console.warn("[dineleak] google cache write failed", {
      cacheKey,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

function classifyGoogleError(status: number, body: string): { kind: GoogleErrorKind; responseError: GoogleResponseError | null } {
  let parsed: GoogleResponseError | null = null;
  try {
    parsed = JSON.parse(body) as GoogleResponseError;
  } catch {
    parsed = null;
  }

  const message = `${parsed?.message ?? ""} ${body}`.toLowerCase();

  if (status === 429 || message.includes("quota exceeded") || message.includes("rate limit")) {
    return { kind: "quota", responseError: parsed };
  }
  if (status === 401 || status === 403 || message.includes("api key") || message.includes("permission denied") || message.includes("invalid api key")) {
    return { kind: "invalid_key", responseError: parsed };
  }
  if (status >= 400 && status < 500) {
    return { kind: "bad_request", responseError: parsed };
  }
  return { kind: status >= 500 ? "upstream" : "network", responseError: parsed };
}

async function fetchJson<T>(url: string, timeoutMs = DEFAULT_TIMEOUT_MS, label = "google fetch", maxRetries = DEFAULT_MAX_RETRIES): Promise<T | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "user-agent": "DineLeakBot/1.0 (+https://dineleak.app)",
          accept: "application/json",
        },
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        const classification = classifyGoogleError(response.status, body);
        console.warn(`[dineleak] ${label} request failed`, {
          status: response.status,
          statusText: response.statusText,
          kind: classification.kind,
          attempt: attempt + 1,
          maxRetries,
          message: classification.responseError?.message ?? null,
          code: classification.responseError?.code ?? null,
          reason: classification.responseError?.details?.[0]?.reason ?? null,
        });

        const retryable = classification.kind === "timeout" || classification.kind === "network" || classification.kind === "upstream";
        if (retryable && attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 250));
          continue;
        }

        return null;
      }

      const json = (await response.json()) as T;
      return json;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const kind: GoogleErrorKind = message.toLowerCase().includes("abort") ? "timeout" : "network";
      console.warn(`[dineleak] ${label} request failed`, {
        kind,
        message,
        attempt: attempt + 1,
        maxRetries,
      });

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        continue;
      }

      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  return null;
}

async function fetchPageSpeedSignals(website: string): Promise<GooglePageSpeedSignals | null> {
  const normalizedUrl = normalizeUrl(website);
  const config = getGoogleConfig();
  const timeoutMs = Math.max(config.timeoutMs, 12_000);
  const cacheKey = getCacheKey("pagespeed", getUrlScope(normalizedUrl));
  const cached = await readCachedSignal<GooglePageSpeedSignals>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY?.trim();
  if (!isGoogleEnabled() || !config.pageSpeedEnabled) {
    return null;
  }

  if (!apiKey) {
    logMissingKey("pagespeed");
    return null;
  }

  const searchParams = new URLSearchParams({
    url: normalizedUrl,
    strategy: "mobile",
    key: apiKey,
  });
  searchParams.append("category", "performance");
  searchParams.append("category", "accessibility");
  searchParams.append("category", "seo");
  searchParams.append("category", "best-practices");

  const endpoints = [
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${searchParams.toString()}`,
    `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?${searchParams.toString()}`,
  ];

  let response = await fetchJson<{
    error?: GoogleResponseError;
    lighthouseResult?: {
      finalUrl?: string;
      categories?: {
        performance?: { score?: number };
        accessibility?: { score?: number };
        "best-practices"?: { score?: number };
        seo?: { score?: number };
      };
    };
    loadingExperience?: {
      overall_category?: string;
      metrics?: Record<string, { percentile?: number; category?: string }>;
    };
    id?: string;
  }>(endpoints[0], timeoutMs, "pagespeed", config.maxRetries);

  if (!response) {
    response = await fetchJson<{
      error?: GoogleResponseError;
      lighthouseResult?: {
        finalUrl?: string;
        categories?: {
          performance?: { score?: number };
          accessibility?: { score?: number };
          "best-practices"?: { score?: number };
          seo?: { score?: number };
        };
      };
      loadingExperience?: {
        overall_category?: string;
        metrics?: Record<string, { percentile?: number; category?: string }>;
      };
      id?: string;
    }>(endpoints[1], timeoutMs, "pagespeed alternate", config.maxRetries);
  }

  if (!response) {
    return null;
  }

  if (response.error) {
    const message = `${response.error.message ?? ""} ${(response.error.details ?? []).map((detail) => detail.reason ?? detail.message ?? "").join(" ")}`.trim();
    const lower = message.toLowerCase();
    const kind: GoogleErrorKind =
      response.error.code === 429 || lower.includes("quota") ? "quota" : response.error.code === 403 || lower.includes("api key") ? "invalid_key" : "bad_request";
    console.warn("[dineleak] pagespeed api error", {
      website: normalizedUrl,
      kind,
      code: response.error.code ?? null,
      status: response.error.status ?? null,
      message: response.error.message ?? null,
      reason: response.error.details?.[0]?.reason ?? null,
    });
    console.warn("[dineleak] pagespeed fallback reason", {
      website: normalizedUrl,
      reason: kind,
      responseStatus: response.error.code ?? null,
    });
    return null;
  }

  const lighthouse = response?.lighthouseResult;
  const categories = lighthouse?.categories;
  const performanceScore = toScore(categories?.performance?.score);
  const accessibilityScore = toScore(categories?.accessibility?.score);
  const bestPracticesScore = toScore(categories?.["best-practices"]?.score);
  const seoScore = toScore(categories?.seo?.score);
  const metrics = response?.loadingExperience?.metrics ?? {};
  const coreWebVitals = {
    largestContentfulPaintMs: typeof metrics.LARGEST_CONTENTFUL_PAINT_MS?.percentile === "number" ? metrics.LARGEST_CONTENTFUL_PAINT_MS.percentile : null,
    cumulativeLayoutShift: typeof metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile === "number" ? metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile : null,
    interactionToNextPaintMs: typeof metrics.INTERACTION_TO_NEXT_PAINT?.percentile === "number" ? metrics.INTERACTION_TO_NEXT_PAINT.percentile : null,
    firstContentfulPaintMs: typeof metrics.FIRST_CONTENTFUL_PAINT_MS?.percentile === "number" ? metrics.FIRST_CONTENTFUL_PAINT_MS.percentile : null,
    speedIndexMs: typeof metrics.SPEED_INDEX_MS?.percentile === "number" ? metrics.SPEED_INDEX_MS.percentile : null,
    overallCategory: response?.loadingExperience?.overall_category ?? null,
  };

  if (
    performanceScore === null ||
    accessibilityScore === null ||
    bestPracticesScore === null ||
    seoScore === null
  ) {
    console.warn("[dineleak] pagespeed response missing metrics", {
      website: normalizedUrl,
      hasConfiguredKey: Boolean(apiKey),
    });
    return null;
  }

  const hasCoreWebVitals =
    coreWebVitals.largestContentfulPaintMs !== null ||
    coreWebVitals.cumulativeLayoutShift !== null ||
    coreWebVitals.interactionToNextPaintMs !== null ||
    coreWebVitals.firstContentfulPaintMs !== null ||
    coreWebVitals.speedIndexMs !== null ||
    coreWebVitals.overallCategory !== null;

  const payload = {
    mobileUrlTested: lighthouse?.finalUrl || response?.id || normalizedUrl,
    performanceScore,
    accessibilityScore,
    seoScore,
    bestPracticesScore,
    coreWebVitals: hasCoreWebVitals ? coreWebVitals : null,
    fetchedAt: new Date().toISOString(),
  };

  await writeCachedSignal(cacheKey, "pagespeed", getUrlScope(normalizedUrl), payload);
  return payload;
}

async function fetchPlacesSignalsNew(input: AuditInput): Promise<GooglePlacesSignals | null> {
  const config = getGoogleConfig();
  const query = [input.restaurant, input.city, input.cuisine].map((value) => value?.trim()).filter(Boolean).join(" ");
  if (!query) {
    return null;
  }

  const cacheKey = getCacheKey("places", query.toLowerCase());
  const cached = await readCachedSignal<GooglePlacesSignals>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!isGoogleEnabled() || !config.placesEnabled) {
    return null;
  }

  if (!apiKey) {
    logMissingKey("places");
    return null;
  }

  const fieldMask = "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.currentOpeningHours,places.googleMapsUri";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const searchResponseLive = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
        "x-goog-fieldmask": fieldMask,
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: "en",
        regionCode: "us",
      }),
    });

    if (!searchResponseLive.ok) {
      const body = await searchResponseLive.text().catch(() => "");
      const classification = classifyGoogleError(searchResponseLive.status, body);
      console.warn("[dineleak] places new search failed", {
        restaurant: input.restaurant,
        city: input.city || null,
        kind: classification.kind,
        status: searchResponseLive.status,
        code: classification.responseError?.code ?? null,
        reason: classification.responseError?.details?.[0]?.reason ?? null,
      });
      return null;
    }

    const searchData = (await searchResponseLive.json()) as {
      places?: Array<{
        id?: string;
        displayName?: { text?: string } | string;
        formattedAddress?: string;
        rating?: number;
        userRatingCount?: number;
        currentOpeningHours?: { weekdayDescriptions?: string[] };
        googleMapsUri?: string;
      }>;
    };

    const firstPlace = searchData.places?.[0];
    if (!firstPlace?.id) {
      console.warn("[dineleak] places new search returned no results", {
        restaurant: input.restaurant,
        city: input.city || null,
      });
      return null;
    }

    const detailsResponse = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(firstPlace.id)}`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "x-goog-api-key": apiKey,
        "x-goog-fieldmask": fieldMask,
      },
    });

    if (!detailsResponse.ok) {
      const body = await detailsResponse.text().catch(() => "");
      const classification = classifyGoogleError(detailsResponse.status, body);
      console.warn("[dineleak] places new details failed", {
        restaurant: input.restaurant,
        city: input.city || null,
        kind: classification.kind,
        status: detailsResponse.status,
        code: classification.responseError?.code ?? null,
        reason: classification.responseError?.details?.[0]?.reason ?? null,
      });
      const payload = {
        placeName: typeof firstPlace.displayName === "string" ? firstPlace.displayName : firstPlace.displayName?.text ?? null,
        rating: typeof firstPlace.rating === "number" ? firstPlace.rating : null,
        reviewCount: typeof firstPlace.userRatingCount === "number" ? firstPlace.userRatingCount : null,
        address: firstPlace.formattedAddress ?? null,
        businessHours: firstPlace.currentOpeningHours?.weekdayDescriptions ?? [],
        googleMapsUrl: firstPlace.googleMapsUri ?? null,
        fetchedAt: new Date().toISOString(),
      };
      await writeCachedSignal(cacheKey, "places", query.toLowerCase(), payload);
      return payload;
    }

    const detailsData = (await detailsResponse.json()) as {
      id?: string;
      displayName?: { text?: string } | string;
      formattedAddress?: string;
      rating?: number;
      userRatingCount?: number;
      currentOpeningHours?: { weekdayDescriptions?: string[] };
      googleMapsUri?: string;
    };

    const placeName = typeof detailsData.displayName === "string" ? detailsData.displayName : detailsData.displayName?.text ?? null;
    const businessHours = detailsData.currentOpeningHours?.weekdayDescriptions ?? firstPlace.currentOpeningHours?.weekdayDescriptions ?? [];

    const payload = {
      placeName,
      rating: typeof detailsData.rating === "number" ? detailsData.rating : typeof firstPlace.rating === "number" ? firstPlace.rating : null,
      reviewCount: typeof detailsData.userRatingCount === "number" ? detailsData.userRatingCount : typeof firstPlace.userRatingCount === "number" ? firstPlace.userRatingCount : null,
      address: detailsData.formattedAddress ?? firstPlace.formattedAddress ?? null,
      businessHours,
      googleMapsUrl: detailsData.googleMapsUri ?? firstPlace.googleMapsUri ?? null,
      fetchedAt: new Date().toISOString(),
    };
    await writeCachedSignal(cacheKey, "places", query.toLowerCase(), payload);
    return payload;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const kind: GoogleErrorKind = message.toLowerCase().includes("abort") ? "timeout" : "network";
    console.warn("[dineleak] places new request failed", {
      restaurant: input.restaurant,
      city: input.city || null,
      kind,
      message,
    });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPlacesSignalsLegacy(input: AuditInput): Promise<GooglePlacesSignals | null> {
  const config = getGoogleConfig();
  const query = [input.restaurant, input.city, input.cuisine].map((value) => value?.trim()).filter(Boolean).join(" ");
  if (!query) {
    return null;
  }

  const cacheKey = getCacheKey("places", query.toLowerCase());
  const cached = await readCachedSignal<GooglePlacesSignals>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!isGoogleEnabled() || !config.placesEnabled) {
    return null;
  }

  if (!apiKey) {
    logMissingKey("places");
    return null;
  }

  const searchParams = new URLSearchParams({
    query,
    key: apiKey,
  });

  const textSearch = await fetchJson<{
    status?: string;
    results?: Array<{ place_id?: string; name?: string }>;
  }>(`https://maps.googleapis.com/maps/api/place/textsearch/json?${searchParams.toString()}`, config.timeoutMs, "places legacy textsearch", config.maxRetries);

  const placeId = textSearch?.results?.[0]?.place_id;
  if (!placeId) return null;

  const detailsParams = new URLSearchParams({
    place_id: placeId,
    fields: "name,rating,user_ratings_total,formatted_address,opening_hours,url",
    key: apiKey,
  });

  const details = await fetchJson<{
    error?: GoogleResponseError;
    status?: string;
    result?: {
      name?: string;
      rating?: number;
      user_ratings_total?: number;
      formatted_address?: string;
      opening_hours?: { weekday_text?: string[] };
      url?: string;
    };
  }>(`https://maps.googleapis.com/maps/api/place/details/json?${detailsParams.toString()}`, config.timeoutMs, "places legacy details", config.maxRetries);

  if (!details) {
    return null;
  }

  if (details.error) {
    const message = `${details.error.message ?? ""} ${(details.error.details ?? []).map((detail) => detail.reason ?? detail.message ?? "").join(" ")}`.trim();
    const lower = message.toLowerCase();
    const kind: GoogleErrorKind =
      details.error.code === 429 || lower.includes("quota") ? "quota" : details.error.code === 403 || lower.includes("api key") ? "invalid_key" : "bad_request";
    console.warn("[dineleak] places legacy api error", {
      restaurant: input.restaurant,
      city: input.city || null,
      kind,
      errorCode: details.error.code ?? null,
      errorStatus: details.error.status ?? null,
      errorMessage: details.error.message ?? null,
    });
    return null;
  }

  const result = details?.result;
  if (!result) return null;

  const payload = {
    placeName: result.name ?? textSearch.results?.[0]?.name ?? null,
    rating: typeof result.rating === "number" ? result.rating : null,
    reviewCount: typeof result.user_ratings_total === "number" ? result.user_ratings_total : null,
    address: result.formatted_address ?? null,
    businessHours: result.opening_hours?.weekday_text ?? [],
    googleMapsUrl:
      result.url ??
      (placeId ? `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(placeId)}` : null),
    fetchedAt: new Date().toISOString(),
  };
  await writeCachedSignal(cacheKey, "places", query.toLowerCase(), payload);
  return payload;
}

async function fetchPlacesSignals(input: AuditInput): Promise<GooglePlacesSignals | null> {
  const newApiResult = await fetchPlacesSignalsNew(input);
  if (newApiResult) return newApiResult;

  return fetchPlacesSignalsLegacy(input);
}

export async function fetchGoogleAuditSignals(input: AuditInput): Promise<GoogleAuditSignals | null> {
  const [pageSpeed, places] = await Promise.all([fetchPageSpeedSignals(input.website), fetchPlacesSignals(input)]);

  if (!pageSpeed && !places) return null;

  return {
    pageSpeed,
    places,
  };
}
