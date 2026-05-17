import { NextResponse } from "next/server";
import { getAppUrl, getPlanPriceId, getStripe, planConfig, type CheckoutPlanId } from "@/lib/stripe";

type CheckoutBody = {
  planId?: CheckoutPlanId;
  restaurantName?: string;
  restaurantWebsite?: string;
  restaurantInstagram?: string;
  restaurantTikTok?: string;
  cuisine?: string;
  city?: string;
  customerEmail?: string;
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    const body = (await request.json()) as CheckoutBody;
    const planId = body.planId;

    if (!planId || !(planId in planConfig)) {
      return NextResponse.json({ error: "Invalid checkout plan." }, { status: 400 });
    }

    const config = planConfig[planId];
    const { priceId, priceEnvKey } = getPlanPriceId(planId);

    const baseUrl = getAppUrl(request);
    const stripe = getStripe();
    const metadata = {
      selected_product_type: planId,
      selected_product: config.successLabel,
      product_name: config.successLabel,
      customer_email: body.customerEmail?.trim() || "",
      restaurant_name: body.restaurantName?.trim() || "",
      restaurant_website: body.restaurantWebsite?.trim() || "",
      restaurant_social: body.restaurantInstagram?.trim() || body.restaurantTikTok?.trim() || "",
      restaurant_instagram: body.restaurantInstagram?.trim() || "",
      restaurant_tiktok: body.restaurantTikTok?.trim() || "",
      restaurant_cuisine: body.cuisine?.trim() || "",
      restaurant_city: body.city?.trim() || "",
      source: "DineLeak",
    };

    console.info("[dineintel] stripe checkout started", {
      planId,
      restaurantName: body.restaurantName || null,
      restaurantWebsite: body.restaurantWebsite || null,
      restaurantInstagram: body.restaurantInstagram || null,
      restaurantTikTok: body.restaurantTikTok || null,
      priceEnvKey,
    });
    const session = await stripe.checkout.sessions.create({
      mode: config.mode,
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: body.customerEmail?.trim() || undefined,
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&plan=${planId}`,
      cancel_url: `${baseUrl}/cancel?plan=${planId}`,
      client_reference_id: planId,
      metadata,
      ...(config.mode === "subscription" ? { subscription_data: { metadata } } : {}),
      allow_promotion_codes: false,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create checkout session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
