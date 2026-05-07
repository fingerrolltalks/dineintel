import { NextResponse } from "next/server";
import { generateAudit, type AuditInput } from "@/lib/audit";

export async function POST(request: Request) {
  const body = (await request.json()) as AuditInput;

  return NextResponse.json({
    ...generateAudit(body),
    aiReady: Boolean(process.env.OPENAI_API_KEY),
  });
}
