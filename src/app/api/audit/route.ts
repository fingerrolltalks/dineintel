import { NextResponse } from "next/server";
import { generateAudit, type AuditInput } from "@/lib/audit";
import { generateOpenAIAuditWithOptions } from "@/lib/openai-audit";
import { fetchGoogleAuditSignals } from "@/lib/google-signals";
import { fetchWebsiteSnapshot } from "@/lib/website-snapshot";
import { saveAuditRun } from "@/lib/audit-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AuditInput;
    if (!body.website?.trim()) {
      return NextResponse.json({ error: "Website is required." }, { status: 400 });
    }

    console.info("[dineleak] audit started", {
      restaurant: body.restaurant,
      website: body.website,
    });

    const [snapshot, googleSignals] = await Promise.all([
      fetchWebsiteSnapshot(body.website),
      fetchGoogleAuditSignals(body),
    ]);
    console.info("[dineleak] google signals status", {
      hasPageSpeedKey: Boolean(process.env.GOOGLE_PAGESPEED_API_KEY?.trim()),
      hasPlacesKey: Boolean(process.env.GOOGLE_PLACES_API_KEY?.trim()),
      hasGoogleSignals: Boolean(googleSignals),
      hasPageSpeed: Boolean(googleSignals?.pageSpeed),
      hasPlaces: Boolean(googleSignals?.places),
    });
    const enrichedSnapshot = {
      ...snapshot,
      googleSignals,
    };
    const aiResult = await generateOpenAIAuditWithOptions(body, enrichedSnapshot, { googleSignals });
    const usedFallback = !aiResult;
    const result = aiResult ?? generateAudit(body);

    const savedAudit = await saveAuditRun({
      input: body,
      snapshot: enrichedSnapshot,
      result,
      generatedBy: aiResult ? "openai" : "template",
    });

    console.info("[dineleak] audit completed", {
      auditId: savedAudit.auditId,
      generatedBy: aiResult ? "openai" : "template",
      fallbackUsed: usedFallback,
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
