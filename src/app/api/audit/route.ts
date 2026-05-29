import { NextResponse } from "next/server";
import { generateAudit, type AuditInput } from "@/lib/audit";
import { findLatestAuditRunByRestaurant, saveAuditRun } from "@/lib/audit-storage";
import { checkScanRateLimit, getClientIpFromRequest, hashScanIp, recordScanAttempt, shouldBypassScanRateLimit } from "@/lib/scan-guard";
import { generateOpenAIAuditWithOptions } from "@/lib/openai-audit";
import { fetchGoogleAuditSignals } from "@/lib/google-signals";
import { fetchWebsiteSnapshot } from "@/lib/website-snapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AuditInput;
    if (!body.website?.trim()) {
      return NextResponse.json({ error: "Website is required." }, { status: 400 });
    }

    const ipHash = hashScanIp(getClientIpFromRequest(request));
    const testingBypass = shouldBypassScanRateLimit(request);
    if (!testingBypass) {
      await recordScanAttempt(ipHash, body.restaurant, body.website);
      const rateLimit = await checkScanRateLimit(ipHash);
      if (!rateLimit.allowed) {
        console.warn("[dineleak] audit rate limited", {
          restaurant: body.restaurant,
          website: body.website,
          attempts: rateLimit.attempts,
          limit: rateLimit.limit,
        });
        return NextResponse.json(
          {
            error: "You’ve reached the hourly scan limit. Please wait a bit before trying again.",
            retryAfterSeconds: rateLimit.retryAfterSeconds,
          },
          { status: 429 },
        );
      }
    }

    const cachedAudit = await findLatestAuditRunByRestaurant(body.restaurant, body.website);
    if (cachedAudit && Date.now() - new Date(cachedAudit.createdAt).getTime() < 24 * 60 * 60 * 1000) {
      const googleEnrichmentEnabled = process.env.GOOGLE_ENRICHMENT_ENABLED?.trim() !== "false";
      const pageSpeedEnabled = process.env.PAGESPEED_ENABLED?.trim() !== "false";
      const placesEnabled = process.env.PLACES_ENABLED?.trim() !== "false";
      const hasCachedPageSpeed = Boolean(cachedAudit.snapshot.googleSignals?.pageSpeed);
      const hasCachedPlaces = Boolean(cachedAudit.snapshot.googleSignals?.places);
      const shouldRefreshGoogleSignals =
        googleEnrichmentEnabled &&
        ((pageSpeedEnabled && !hasCachedPageSpeed && Boolean(process.env.GOOGLE_PAGESPEED_API_KEY?.trim())) ||
          (placesEnabled && !hasCachedPlaces && Boolean(process.env.GOOGLE_PLACES_API_KEY?.trim())));

      if (!shouldRefreshGoogleSignals) {
        return NextResponse.json({
          ...cachedAudit.result,
          auditId: cachedAudit.auditId,
          websiteSnapshot: {
            ...cachedAudit.snapshot,
            googleSignals: cachedAudit.snapshot.googleSignals ?? null,
          },
          aiReady: Boolean(process.env.OPENAI_API_KEY),
          generatedBy: cachedAudit.generatedBy,
          googleSignals: cachedAudit.snapshot.googleSignals ?? null,
          cached: true,
        });
      }
    }

    const [snapshot, googleSignals] = await Promise.all([
      fetchWebsiteSnapshot(body.website),
      fetchGoogleAuditSignals(body),
    ]);
    const enrichedSnapshot = {
      ...snapshot,
      googleSignals,
    };
    const aiResult = await generateOpenAIAuditWithOptions(body, enrichedSnapshot, { googleSignals });
    const result = aiResult ?? generateAudit(body);

    const savedAudit = await saveAuditRun({
      input: body,
      snapshot: enrichedSnapshot,
      result,
      generatedBy: aiResult ? "openai" : "template",
    });

    return NextResponse.json({
      ...result,
      auditId: savedAudit.auditId,
      websiteSnapshot: enrichedSnapshot,
      aiReady: Boolean(process.env.OPENAI_API_KEY),
      generatedBy: aiResult ? "openai" : "template",
      googleSignals,
    });
  } catch (error) {
    console.error("[dineleak] audit route error", error);
    return NextResponse.json({ error: "Failed to generate audit." }, { status: 500 });
  }
}
