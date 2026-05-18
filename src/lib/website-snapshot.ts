import type { GoogleAuditSignals } from "@/lib/google-signals";

export type WebsiteAuditSnapshot = {
  requestedUrl: string;
  finalUrl: string | null;
  fetchedAt: string;
  title: string | null;
  description: string | null;
  headings: string[];
  ctaTexts: string[];
  menuLinks: string[];
  socialLinks: string[];
  mobileHints: string[];
  contactInfo: {
    emails: string[];
    phones: string[];
    addresses: string[];
    hasContactPage: boolean;
  };
  reviewSignals: string[];
  cuisineGuess: string | null;
  cityGuess: string | null;
  pageTextPreview: string;
  htmlLength: number;
  fetchError: string | null;
  googleSignals?: GoogleAuditSignals | null;
};

const publicHostPatterns = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^\[::1\]$/,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
];

function isPrivateHostname(hostname: string) {
  return publicHostPatterns.some((pattern) => pattern.test(hostname));
}

function stripTags(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniq(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function extractMatches(regex: RegExp, html: string) {
  const matches = [...html.matchAll(regex)].map((match) => match[1] ?? match[0]);
  return uniq(matches);
}

function extractAnchorPairs(html: string) {
  return [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map((match) => ({
    href: match[1].trim(),
    text: stripTags(match[2] ?? ""),
  }));
}

function extractMeta(html: string, key: string) {
  const regex = new RegExp(`<meta[^>]*(?:name|property)=["']${key}["'][^>]*content=["']([^"']+)["']`, "i");
  return html.match(regex)?.[1]?.trim() ?? null;
}

function inferCuisine(text: string) {
  const cues = [
    "pizza",
    "sushi",
    "burger",
    "steak",
    "taco",
    "thai",
    "italian",
    "mexican",
    "indian",
    "mediterranean",
    "bbq",
    "seafood",
    "vegan",
    "pasta",
    "ramen",
    "bakery",
    "coffee",
    "brunch",
  ];

  const lower = text.toLowerCase();
  const found = cues.find((cue) => lower.includes(cue));
  return found ? found.charAt(0).toUpperCase() + found.slice(1) : null;
}

function inferCity(text: string) {
  const cityMatch =
    text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*,\s*[A-Z]{2}\b/)?.[1] ??
    text.match(/\b(?:in|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/)?.[1] ??
    null;
  return cityMatch ? cityMatch.trim() : null;
}

function summarizeText(html: string) {
  return stripTags(html).slice(0, 1400);
}

export async function fetchWebsiteSnapshot(rawUrl: string): Promise<WebsiteAuditSnapshot> {
  const requestedUrl = rawUrl.trim();
  const normalizedUrl = requestedUrl.match(/^https?:\/\//i) ? requestedUrl : `https://${requestedUrl}`;

  try {
    const parsedUrl = new URL(normalizedUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Unsupported URL protocol.");
    }
    if (isPrivateHostname(parsedUrl.hostname)) {
      throw new Error("Private or local hosts are not allowed.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const response = await fetch(parsedUrl.toString(), {
      redirect: "follow",
      headers: {
        "user-agent": "DineLeakBot/1.0 (+https://dineleak.app)",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const html = (await response.text()).slice(0, 180_000);
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ? stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "") : null;
    const description = extractMeta(html, "description") || extractMeta(html, "og:description");
    const headingTexts = uniq([
      ...extractMatches(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, html),
      ...extractMatches(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, html),
      ...extractMatches(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, html),
    ].map(stripTags)).slice(0, 12);

    const anchors = extractAnchorPairs(html);
    const ctaTexts = uniq(
      anchors
        .filter(({ text }) => /menu|order|reserve|book|call|visit|contact|download|catering|delivery|takeout/i.test(text))
        .map(({ text }) => text),
    ).slice(0, 10);

    const menuLinks = uniq(
      anchors
        .filter(({ href, text }) => /menu|order|reserv|booking|delivery|takeout|catering/i.test(`${href} ${text}`))
        .map(({ href }) => href),
    ).slice(0, 10);

    const socialLinks = uniq(
      anchors
        .filter(({ href }) =>
          /instagram|tiktok|facebook|x\.com|twitter|youtube|linkedin|threads|pinterest/i.test(href),
        )
        .map(({ href }) => href),
    ).slice(0, 12);

    const bodyText = summarizeText(html);
    const emails = uniq([
      ...extractMatches(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, bodyText),
      ...anchors.filter(({ href }) => href.startsWith("mailto:")).map(({ href }) => href.replace(/^mailto:/i, "")),
    ]).slice(0, 8);
    const phones = uniq([
      ...extractMatches(/(?:\+?\d{1,2}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/g, bodyText),
      ...anchors.filter(({ href }) => href.startsWith("tel:")).map(({ href }) => href.replace(/^tel:/i, "")),
    ]).slice(0, 8);
    const addresses = uniq(
      extractMatches(/\b\d{1,5}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){1,6},\s*[A-Z][A-Za-z.\s-]+(?:,\s*[A-Z]{2})?\b/g, bodyText),
    ).slice(0, 5);

    const hasContactPage = anchors.some(({ href, text }) => /contact|about|location|visit/i.test(`${href} ${text}`));
    const reviewSignals = uniq(
      [
        /review/i.test(bodyText) ? "Review mentions present" : "",
        /yelp/i.test(bodyText) ? "Yelp referenced" : "",
        /google reviews?/i.test(bodyText) ? "Google reviews referenced" : "",
        /tripadvisor/i.test(bodyText) ? "Tripadvisor referenced" : "",
        /testimonial/i.test(bodyText) ? "Testimonials present" : "",
        /star rating|rated|ratings?/i.test(bodyText) ? "Rating language present" : "",
      ].filter(Boolean) as string[],
    );

    const mobileHints = uniq([
      /<meta[^>]*name=["']viewport["']/i.test(html) ? "Viewport meta present" : "Missing viewport meta",
      /srcset=/i.test(html) ? "Responsive image srcset detected" : "No responsive image hints detected",
      /sticky|fixed/i.test(html) && /order|reserve|menu/i.test(bodyText) ? "Likely sticky CTA behavior" : "",
      /hamburger|menu-toggle|nav-toggle/i.test(html) ? "Menu toggle detected" : "",
    ].filter(Boolean) as string[]);

    const pageTextPreview = bodyText.slice(0, 1200);
    const combinedText = [title, description, headingTexts.join(" "), bodyText].filter(Boolean).join(" ");

    return {
      requestedUrl: requestedUrl,
      finalUrl: response.url,
      fetchedAt: new Date().toISOString(),
      title,
      description,
      headings: headingTexts,
      ctaTexts,
      menuLinks,
      socialLinks,
      mobileHints,
      contactInfo: {
        emails,
        phones,
        addresses,
        hasContactPage,
      },
      reviewSignals,
      cuisineGuess: inferCuisine(combinedText),
      cityGuess: inferCity(combinedText),
      pageTextPreview,
      htmlLength: html.length,
      fetchError: null,
    };
  } catch (error) {
    return {
      requestedUrl,
      finalUrl: null,
      fetchedAt: new Date().toISOString(),
      title: null,
      description: null,
      headings: [],
      ctaTexts: [],
      menuLinks: [],
      socialLinks: [],
      mobileHints: [],
      contactInfo: {
        emails: [],
        phones: [],
        addresses: [],
        hasContactPage: false,
      },
      reviewSignals: [],
      cuisineGuess: null,
      cityGuess: null,
      pageTextPreview: "",
      htmlLength: 0,
      fetchError: error instanceof Error ? error.message : "Failed to fetch website.",
    };
  }
}
