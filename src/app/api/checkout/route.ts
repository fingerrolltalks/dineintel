import { NextResponse } from "next/server";
import { buildCheckoutPriceData, getAppUrl, getPlanPriceId, getStripe, planConfig, type CheckoutPlanId } from "@/lib/stripe";

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
  let requestPlanId: CheckoutPlanId | undefined;

  try {
    const body = (await request.json()) as CheckoutBody;
    const planId = body.planId;
    requestPlanId = planId;

    if (!planId || !(planId in planConfig)) {
      return NextResponse.json({ error: "Invalid checkout plan." }, { status: 400 });
    }

    const config = planConfig[planId];
    const { priceId, priceEnvKey } = getPlanPriceId(planId);
    const stripeSecretPresent = Boolean(process.env.STRIPE_SECRET_KEY?.trim());
    const deploymentEnv = process.env.VERCEL_ENV ?? "unknown";

    const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") || "";
    const baseUrl = getAppUrl(request);
    const stripe = getStripe();
    const priceData = await buildCheckoutPriceData(planId);
    const metadata = {
      selected_product_type: planId,
      selected_product: config.checkoutName,
      product_name: config.checkoutName,
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

    console.info("[dineleak] stripe checkout started", {
      planId,
      deploymentEnv,
      stripeSecretPresent,
      priceEnvKey,
      priceIdStartsWithPrice: priceId.startsWith("price_"),
      appUrlSource: configuredAppUrl ? "NEXT_PUBLIC_APP_URL" : "request-origin",
      appUrl: baseUrl,
      restaurantName: body.restaurantName || null,
      restaurantWebsite: body.restaurantWebsite || null,
      restaurantInstagram: body.restaurantInstagram || null,
      restaurantTikTok: body.restaurantTikTok || null,
    });
    const session = await stripe.checkout.sessions.create({
      mode: config.mode,
      line_items: [{ price_data: priceData, quantity: 1 }],
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
    const stripeError = error as { type?: string; code?: string; statusCode?: number };
    console.error("[dineleak] checkout failed", {
      message,
      planId: requestPlanId ?? null,
      selectedEnvKey: requestPlanId ? planConfig[requestPlanId].priceEnvKey : null,
      errorType: stripeError?.type ?? null,
      errorCode: stripeError?.code ?? null,
      statusCode: stripeError?.statusCode ?? null,
    });
    return NextResponse.json(
      { error: "Checkout is temporarily unavailable. Please try again or contact support." },
      { status: 500 },
    );
  }
}
