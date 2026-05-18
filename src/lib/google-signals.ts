import type { AuditInput } from "@/lib/audit";

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

function normalizeUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();
  return trimmed.match(/^https?:\/\//i) ? trimmed : `https://${trimmed}`;
}

function toScore(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return value <= 1 ? Math.round(value * 100) : Math.round(value);
}

async function fetchJson<T>(url: string, timeoutMs = 6000, label = "google fetch"): Promise<T | null> {
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
      console.warn(`[dineleak] ${label} non-ok`, {
        status: response.status,
        statusText: response.statusText,
        body: body.slice(0, 200) || null,
      });
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPageSpeedSignals(website: string): Promise<GooglePageSpeedSignals | null> {
  const normalizedUrl = normalizeUrl(website);
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY?.trim();
  const attempts = apiKey ? [apiKey, null] : [null];
  const hasKey = Boolean(apiKey);

  for (const key of attempts) {
    const searchParams = new URLSearchParams({
      url: normalizedUrl,
      strategy: "mobile",
    });
    searchParams.append("category", "performance");
    searchParams.append("category", "accessibility");
    searchParams.append("category", "seo");
    searchParams.append("category", "best-practices");

    if (key) searchParams.set("key", key);

    const response = await fetchJson<{
      error?: { code?: number; message?: string; status?: string };
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
    }>(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${searchParams.toString()}`, 6000, "pagespeed");

    if (!response) {
      console.warn("[dineleak] pagespeed fetch failed", {
        website: normalizedUrl,
        usedApiKey: Boolean(key),
        hasConfiguredKey: hasKey,
      });
      continue;
    }

    if (response.error) {
      console.warn("[dineleak] pagespeed api error", {
        website: normalizedUrl,
        usedApiKey: Boolean(key),
        hasConfiguredKey: hasKey,
        errorCode: response.error.code ?? null,
        errorStatus: response.error.status ?? null,
        errorMessage: response.error.message ?? null,
      });
      continue;
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
      performanceScore !== null &&
      accessibilityScore !== null &&
      bestPracticesScore !== null &&
      seoScore !== null
    ) {
      console.info("[dineleak] pagespeed metrics fetched", {
        website: normalizedUrl,
        usedApiKey: Boolean(key),
        hasConfiguredKey: hasKey,
      });

      const hasCoreWebVitals =
        coreWebVitals.largestContentfulPaintMs !== null ||
        coreWebVitals.cumulativeLayoutShift !== null ||
        coreWebVitals.interactionToNextPaintMs !== null ||
        coreWebVitals.firstContentfulPaintMs !== null ||
        coreWebVitals.speedIndexMs !== null ||
        coreWebVitals.overallCategory !== null;

      return {
        mobileUrlTested: lighthouse?.finalUrl || response?.id || normalizedUrl,
        performanceScore,
        accessibilityScore,
        seoScore,
        bestPracticesScore,
        coreWebVitals: hasCoreWebVitals ? coreWebVitals : null,
        fetchedAt: new Date().toISOString(),
      };
    }

    console.warn("[dineleak] pagespeed response missing metrics", {
      website: normalizedUrl,
      usedApiKey: Boolean(key),
      hasConfiguredKey: hasKey,
    });
  }

  return null;
}

async function fetchPlacesSignals(input: AuditInput): Promise<GooglePlacesSignals | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!apiKey) return null;

  const query = [input.restaurant, input.city, input.cuisine].map((value) => value?.trim()).filter(Boolean).join(" ");
  if (!query) return null;

  const searchParams = new URLSearchParams({
    query,
    key: apiKey,
  });

  const textSearch = await fetchJson<{
    status?: string;
    results?: Array<{ place_id?: string; name?: string }>;
  }>(`https://maps.googleapis.com/maps/api/place/textsearch/json?${searchParams.toString()}`, 6000, "places textsearch");

  const placeId = textSearch?.results?.[0]?.place_id;
  if (!placeId) return null;

  const detailsParams = new URLSearchParams({
    place_id: placeId,
    fields: "name,rating,user_ratings_total,formatted_address,opening_hours,url",
    key: apiKey,
  });

  const details = await fetchJson<{
    error?: { code?: number; message?: string; status?: string };
    status?: string;
    result?: {
      name?: string;
      rating?: number;
      user_ratings_total?: number;
      formatted_address?: string;
      opening_hours?: { weekday_text?: string[] };
      url?: string;
    };
  }>(`https://maps.googleapis.com/maps/api/place/details/json?${detailsParams.toString()}`, 6000, "places details");

  if (!details) {
    console.warn("[dineleak] places fetch failed", {
      restaurant: input.restaurant,
      city: input.city || null,
    });
    return null;
  }

  if (details.error) {
    console.warn("[dineleak] places api error", {
      restaurant: input.restaurant,
      city: input.city || null,
      errorCode: details.error.code ?? null,
      errorStatus: details.error.status ?? null,
      errorMessage: details.error.message ?? null,
    });
    return null;
  }

  const result = details?.result;
  if (!result) return null;

  return {
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
}

export async function fetchGoogleAuditSignals(input: AuditInput): Promise<GoogleAuditSignals | null> {
  const [pageSpeed, places] = await Promise.all([fetchPageSpeedSignals(input.website), fetchPlacesSignals(input)]);

  if (!pageSpeed && !places) return null;

  return {
    pageSpeed,
    places,
  };
}
