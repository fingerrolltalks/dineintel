import { NextResponse } from "next/server";
import { generateAudit, type AuditInput } from "@/lib/audit";
import { generateOpenAIAudit } from "@/lib/openai-audit";
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

    console.info("[dineintel] audit started", {
      restaurant: body.restaurant,
      website: body.website,
    });

    const snapshot = await fetchWebsiteSnapshot(body.website);
    const aiResult = await generateOpenAIAudit(body, snapshot);
    const usedFallback = !aiResult;
    const result = aiResult ?? generateAudit(body);

    const savedAudit = await saveAuditRun({
      input: body,
      snapshot,
      result,
      generatedBy: aiResult ? "openai" : "template",
    });

    console.info("[dineintel] audit completed", {
      auditId: savedAudit.auditId,
      generatedBy: aiResult ? "openai" : "template",
      fallbackUsed: usedFallback,
    });

    return NextResponse.json({
      ...result,
      auditId: savedAudit.auditId,
      websiteSnapshot: snapshot,
      aiReady: Boolean(process.env.OPENAI_API_KEY),
      generatedBy: aiResult ? "openai" : "template",
    });
  } catch (error) {
    console.error("[dineintel] audit route error", error);
    return NextResponse.json({ error: "Failed to generate audit." }, { status: 500 });
  }
}
