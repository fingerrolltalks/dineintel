import Stripe from "stripe";

export type CheckoutPlanId = "report" | "starter" | "pro";

export const planConfig: Record<
  CheckoutPlanId,
  {
    priceEnvKeys: Array<
      | "STRIPE_PRICE_REPORT"
      | "STRIPE_PRICE_DETAILED_REPORT"
      | "STRIPE_PRICE_STARTER"
      | "STRIPE_PRICE_STARTER_MONITOR"
      | "STRIPE_PRICE_PRO"
      | "STRIPE_PRICE_PRO_MONITOR"
    >;
    mode: "payment" | "subscription";
    successLabel: string;
  }
> = {
  report: {
    priceEnvKeys: ["STRIPE_PRICE_REPORT", "STRIPE_PRICE_DETAILED_REPORT"],
    mode: "payment",
    successLabel: "Detailed AI Growth Report",
  },
  starter: {
    priceEnvKeys: ["STRIPE_PRICE_STARTER", "STRIPE_PRICE_STARTER_MONITOR"],
    mode: "subscription",
    successLabel: "Growth Monitor Starter",
  },
  pro: {
    priceEnvKeys: ["STRIPE_PRICE_PRO", "STRIPE_PRICE_PRO_MONITOR"],
    mode: "subscription",
    successLabel: "Growth Monitor Pro",
  },
};

let stripeInstance: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();

  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
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
  } catch {
    return requestUrl.origin;
  }

  return configuredUrl;
}

export function getPlanPriceId(planId: CheckoutPlanId) {
  const config = planConfig[planId];

  for (const key of config.priceEnvKeys) {
    const priceId = process.env[key];
    if (priceId) {
      return { priceId, priceEnvKey: key };
    }
  }

  throw new Error(`Missing Stripe price env for ${planId}.`);
}
