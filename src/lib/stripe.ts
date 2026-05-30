import Stripe from "stripe";

export type CheckoutPlanId = "report" | "starter" | "pro";

const STRIPE_PRICE_ENV_KEYS = {
  report: "STRIPE_PRICE_REPORT",
  starter: "STRIPE_PRICE_STARTER",
  pro: "STRIPE_PRICE_PRO",
} as const;

export const planConfig: Record<
  CheckoutPlanId,
  {
    priceEnvKey: (typeof STRIPE_PRICE_ENV_KEYS)[CheckoutPlanId];
    mode: "payment" | "subscription";
    checkoutName: string;
    checkoutDescription: string;
  }
> = {
  report: {
    priceEnvKey: STRIPE_PRICE_ENV_KEYS.report,
    mode: "payment",
    checkoutName: "DineLeak Full Growth Plan",
    checkoutDescription: "One-time AI audit report with downloadable PDF, shareable access, Google-backed signals where available, and AI-estimated insights.",
  },
  starter: {
    priceEnvKey: STRIPE_PRICE_ENV_KEYS.starter,
    mode: "subscription",
    checkoutName: "DineLeak Monitor",
    checkoutDescription: "Monthly AI monitoring for your restaurant’s online presence with recurring scans, saved report history, downloadable reports, view reports anytime by email, and Google reputation + website health tracking.",
  },
  pro: {
    // Pro hidden pending feature differentiation.
    priceEnvKey: STRIPE_PRICE_ENV_KEYS.pro,
    mode: "subscription",
    checkoutName: "DineLeak Monitor",
    checkoutDescription: "Monthly AI monitoring for your restaurant’s online presence with recurring scans, saved report history, downloadable reports, view reports anytime by email, and Google reputation + website health tracking.",
  },
};

export async function buildCheckoutPriceData(planId: CheckoutPlanId) {
  const stripe = getStripe();
  const { priceId } = getPlanPriceId(planId);
  const config = planConfig[planId];
  const price = await stripe.prices.retrieve(priceId);

  if (!price.unit_amount) {
    throw new Error(`Missing unit_amount for ${priceId}.`);
  }

  const productData = {
    name: config.checkoutName,
    description: config.checkoutDescription,
    metadata: {
      brand: "DineLeak",
      plan_id: planId,
      source_price_id: priceId,
    },
  };

  return {
    currency: price.currency,
    unit_amount: price.unit_amount,
    product_data: productData,
    ...(price.recurring
      ? {
          recurring: {
            interval: price.recurring.interval,
            interval_count: price.recurring.interval_count ?? 1,
          },
        }
      : {}),
  };
}

let stripeInstance: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();

  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  if (!key.startsWith("sk_") || key.includes("*")) {
    throw new Error("Invalid STRIPE_SECRET_KEY configuration");
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(key);
  }

  return stripeInstance;
}

export function getAppUrl(request: Request) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  const requestUrl = new URL(request.url);

  if (!configuredUrl) {
    return requestUrl.origin;
  }

  try {
    const parsedConfiguredUrl = new URL(configuredUrl);
    const configuredIsLocal = ["localhost", "127.0.0.1"].includes(parsedConfiguredUrl.hostname);
    const requestIsLocal = ["localhost", "127.0.0.1"].includes(requestUrl.hostname);

    if (configuredIsLocal && requestIsLocal && parsedConfiguredUrl.origin !== requestUrl.origin) {
      return requestUrl.origin;
    }

    if (!configuredIsLocal && parsedConfiguredUrl.hostname !== requestUrl.hostname) {
      return requestUrl.origin;
    }
  } catch {
    return requestUrl.origin;
  }

  return configuredUrl;
}

export function getPlanPriceId(planId: CheckoutPlanId) {
  const config = planConfig[planId];
  const priceId = process.env[config.priceEnvKey]?.trim();

  if (!priceId) {
    throw new Error(`Missing ${config.priceEnvKey} for ${planId} checkout.`);
  }

  if (!priceId.startsWith("price_")) {
    throw new Error(`Invalid ${config.priceEnvKey} for ${planId} checkout.`);
  }

  return { priceId, priceEnvKey: config.priceEnvKey };
}
