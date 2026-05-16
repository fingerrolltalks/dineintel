import { NextResponse } from "next/server";
import { findReportPurchase } from "@/lib/stripe-purchase-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      sessionId?: string;
      customerEmail?: string;
      restaurantName?: string;
      restaurantWebsite?: string;
    };

    const access = await findReportPurchase({
      sessionId: body.sessionId?.trim() || null,
      customerEmail: body.customerEmail?.trim() || null,
      restaurantName: body.restaurantName?.trim() || null,
      restaurantWebsite: body.restaurantWebsite?.trim() || null,
    });

    return NextResponse.json(access);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to check purchase access.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
