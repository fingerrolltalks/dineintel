import { NextResponse } from "next/server";
import { getAppUrl, getStripe, planConfig, type CheckoutPlanId } from "@/lib/stripe";

type CheckoutBody = {
  planId?: CheckoutPlanId;
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
    }

    const body = (await request.json()) as CheckoutBody;
    const planId = body.planId;

    if (!planId || !(planId in planConfig)) {
      return NextResponse.json({ error: "Invalid checkout plan." }, { status: 400 });
    }

    const config = planConfig[planId];
    const priceId = process.env[config.priceEnv];

    if (!priceId) {
      return NextResponse.json({ error: `Missing ${config.priceEnv} environment variable.` }, { status: 500 });
    }

    const baseUrl = getAppUrl(request);
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: config.mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&plan=${planId}`,
      cancel_url: `${baseUrl}/cancel?plan=${planId}`,
      client_reference_id: planId,
      metadata: {
        product: config.successLabel,
        source: "DineIntel",
      },
      allow_promotion_codes: false,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create checkout session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
