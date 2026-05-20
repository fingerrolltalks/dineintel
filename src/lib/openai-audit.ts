import OpenAI from "openai";
import type { AuditInput, AuditResult } from "@/lib/audit";
import type { GoogleAuditSignals } from "@/lib/google-signals";
import type { WebsiteAuditSnapshot } from "@/lib/website-snapshot";

const auditResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["score", "headline", "scores", "opportunities", "categories"],
  properties: {
    score: { type: "integer" },
    headline: { type: "string" },
    scores: {
      type: "object",
      additionalProperties: false,
      required: ["visibility", "trust", "conversion", "menuOrdering", "socialPresence"],
      properties: {
        visibility: { type: "integer" },
        trust: { type: "integer" },
        conversion: { type: "integer" },
        menuOrdering: { type: "integer" },
        socialPresence: { type: "integer" },
      },
    },
    opportunities: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "detail", "impact", "evidenceFound", "whyItMatters", "quickFix"],
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          impact: { type: "string", enum: ["High", "Medium"] },
          evidenceFound: { type: "string" },
          whyItMatters: { type: "string" },
          quickFix: { type: "string" },
        },
      },
    },
    categories: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "score", "issue", "why", "fix"],
        properties: {
          name: { type: "string" },
          score: { type: "integer" },
          issue: { type: "string" },
          why: { type: "string" },
          fix: { type: "string" },
        },
      },
    },
  },
} as const;

const openaiClient = (() => {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
})();

type GenerateOpenAIAuditOptions = {
  previousAudit?: AuditResult | null;
  monitoringPlan?: "starter" | "pro" | null;
  retries?: number;
  googleSignals?: GoogleAuditSignals | null;
};

function clampScore(value: number) {
  return Math.max(48, Math.min(91, Math.round(value)));
}

function normalizeResult(payload: AuditResult): AuditResult {
  return {
    score: clampScore(payload.score),
    headline: payload.headline.trim(),
    scores: payload.scores
      ? {
          visibility: clampScore(payload.scores.visibility),
          trust: clampScore(payload.scores.trust),
          conversion: clampScore(payload.scores.conversion),
          menuOrdering: clampScore(payload.scores.menuOrdering),
          socialPresence: clampScore(payload.scores.socialPresence),
        }
      : undefined,
    opportunities: payload.opportunities.slice(0, 5).map((item) => ({
      title: item.title.trim(),
      detail: item.detail.trim(),
      impact: item.impact,
      evidenceFound: item.evidenceFound?.trim(),
      whyItMatters: item.whyItMatters?.trim(),
      quickFix: item.quickFix?.trim(),
    })),
    categories: payload.categories.slice(0, 5).map((item) => ({
      name: item.name.trim(),
      score: clampScore(item.score),
      issue: item.issue.trim(),
      why: item.why.trim(),
      fix: item.fix.trim(),
    })),
  };
}

function isAuditResult(value: unknown): value is AuditResult {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AuditResult>;
  return (
    typeof candidate.score === "number" &&
    typeof candidate.headline === "string" &&
    candidate.scores !== undefined &&
    Array.isArray(candidate.opportunities) &&
    candidate.opportunities.length >= 5 &&
    Array.isArray(candidate.categories) &&
    candidate.categories.length >= 5
  );
}

export async function generateOpenAIAudit(input: AuditInput, snapshot: WebsiteAuditSnapshot): Promise<AuditResult | null> {
  return generateOpenAIAuditWithOptions(input, snapshot, {});
}

export async function generateOpenAIAuditWithOptions(
  input: AuditInput,
  snapshot: WebsiteAuditSnapshot,
  options: GenerateOpenAIAuditOptions,
): Promise<AuditResult | null> {
  if (!openaiClient) {
    console.warn("[dineleak] openai audit skipped: OPENAI_API_KEY missing");
    return null;
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const retries = options.retries ?? 0;
  const previousAuditBlock = options.previousAudit
    ? `Previous audit snapshot:
${JSON.stringify(options.previousAudit, null, 2)}

Use the previous audit to vary recommendations and focus on changes since the last scan.`
    : "";
  const monitoringBlock = options.monitoringPlan
    ? `Monitoring plan: ${options.monitoringPlan}
This is a recurring scan. Emphasize what changed since the last run.`
    : "";
  const googleSignalsBlock = options.googleSignals
    ? `Google enrichment signals:
${JSON.stringify(options.googleSignals, null, 2)}

Use PageSpeed and Places only when present. Do not invent missing Google data.`
    : "Google enrichment signals: unavailable. Use website snapshot and restaurant input only.";

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    try {
      const response = await openaiClient.responses.create(
        {
          model,
          instructions:
            "You are DineLeak, a premium restaurant growth analyst. Use the provided website snapshot as the primary evidence. If Google enrichment signals are available, use them to sharpen performance, accessibility, SEO, Maps, review, and trust recommendations. Produce concise, sharp, investor-ready restaurant findings. Focus on revenue leaks, conversion, reviews, local visibility, social content, and retention. Keep the tone premium, specific, and actionable. Avoid repetitive generic advice and vary wording across restaurants. Output only valid JSON that matches the schema.",
          input: `Restaurant audit input:
${JSON.stringify(
  {
    restaurant: input.restaurant,
    website: input.website,
    instagram: input.instagram,
    tiktok: input.tiktok || "",
    cuisine: input.cuisine || "",
    city: input.city || "",
  },
  null,
  2,
)}

Website snapshot:
${JSON.stringify(snapshot, null, 2)}

${googleSignalsBlock}

${previousAuditBlock}
${monitoringBlock}

Generate a premium restaurant growth audit with:
- a score between 48 and 91
- a hidden structured score block for Visibility, Trust, Conversion, Menu Ordering, and Social Presence
- one concise headline
- five opportunities
- five category cards for Visibility, Conversion, Reputation, Social, and Retention

Rules:
- Use restaurant name, cuisine, city, website title, meta description, headings, CTA text, menu/order/reservation links, social links, contact info, and review signals.
- Use PageSpeed and Places signals when present to inform performance, accessibility, SEO, and map presence recommendations.
- Make each recommendation specific to the restaurant and site evidence.
- Each opportunity must include evidenceFound, whyItMatters, and quickFix.
- Avoid repeating the same generic phrases across audits.
- If website data is limited, include this exact sentence in at least one recommendation: "Limited website data was found, so this recommendation is based on the information provided."
- Keep the copy concise and premium sounding.
`,
          max_output_tokens: 900,
          text: {
            format: {
              type: "json_schema",
              name: "dineleak_audit",
              strict: true,
              schema: auditResponseSchema,
            },
          },
        },
        { signal: controller.signal },
      );

      const parsed = JSON.parse(response.output_text) as unknown;
      if (!isAuditResult(parsed)) return null;
      console.info("[dineleak] openai audit succeeded", {
        restaurant: input.restaurant,
        model,
        attempt: attempt + 1,
      });
      return normalizeResult(parsed);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isRateLimit = message.toLowerCase().includes("rate limit") || message.includes("429");
      const isTimeout = message.toLowerCase().includes("abort") || message.toLowerCase().includes("timeout");
      const shouldRetry = attempt < retries && (isRateLimit || isTimeout);

      if (shouldRetry) {
        console.warn("[dineleak] openai audit retrying after transient failure", {
          restaurant: input.restaurant,
          attempt: attempt + 1,
        });
        await new Promise((resolve) => setTimeout(resolve, 750));
        continue;
      }

      if (isRateLimit) {
        console.warn("[dineleak] openai audit rate limited, falling back to template", {
          restaurant: input.restaurant,
        });
      } else if (isTimeout) {
        console.warn("[dineleak] openai audit timed out, falling back to template", {
          restaurant: input.restaurant,
        });
      } else {
        console.error("[dineleak] openai audit error", error);
      }
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  return null;
}
