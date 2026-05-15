import Stripe from "stripe";

export type CheckoutPlanId = "report" | "starter" | "pro";

export const planConfig: Record<
  CheckoutPlanId,
  {
    priceEnv:
      | "STRIPE_PRICE_DETAILED_REPORT"
      | "STRIPE_PRICE_STARTER_MONITOR"
      | "STRIPE_PRICE_PRO_MONITOR";
    mode: "payment" | "subscription";
    successLabel: string;
  }
> = {
  report: {
    priceEnv: "STRIPE_PRICE_DETAILED_REPORT",
    mode: "payment",
    successLabel: "Detailed AI Growth Report",
  },
  starter: {
    priceEnv: "STRIPE_PRICE_STARTER_MONITOR",
    mode: "subscription",
    successLabel: "Growth Monitor Starter",
  },
  pro: {
    priceEnv: "STRIPE_PRICE_PRO_MONITOR",
    mode: "subscription",
    successLabel: "Growth Monitor Pro",
  },
};

let stripeInstance: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set.");
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
