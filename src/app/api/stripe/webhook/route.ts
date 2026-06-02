import Stripe from "stripe";
import { NextResponse } from "next/server";
import { buildInvoicePurchaseRecord, buildPurchaseRecord, claimStripeEvent, recordStripePurchase } from "@/lib/stripe-purchase-log";
import { getStripe } from "@/lib/stripe";
import { upsertMonitoringSubscriptionFromStripeSubscription } from "@/lib/monitoring-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[dineleak] stripe webhook missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not set." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Stripe webhook signature.";
    console.error("[dineleak] stripe webhook signature error", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  console.info("[dineleak] stripe webhook received", {
    type: event.type,
    id: event.id,
  });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items.data.price"],
      });

      const priceId = fullSession.line_items?.data?.[0]?.price?.id ?? null;
      const record = buildPurchaseRecord(fullSession, priceId);
      await recordStripePurchase(record);
    } catch (error) {
      console.error("[dineleak] stripe webhook record error", error);
      return NextResponse.json({ error: "Failed to record purchase." }, { status: 500 });
    }

    const claimed = await claimStripeEvent(event.id, event.type);
    if (!claimed) {
      console.info("[dineleak] stripe webhook duplicate ignored after record", {
        type: event.type,
        id: event.id,
      });
      return NextResponse.json({ received: true, duplicate: true });
    }
  } else if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;

    try {
      const fullInvoice = await stripe.invoices.retrieve(invoice.id, {
        expand: ["lines.data.price", "subscription"],
      });

      const lineItem = fullInvoice.lines.data[0] as Stripe.InvoiceLineItem & {
        price?: string | Stripe.Price | null;
      };
      const linePrice = lineItem?.price ?? null;
      const priceId = typeof linePrice === "string" ? linePrice : linePrice?.id ?? null;
      const record = buildInvoicePurchaseRecord(fullInvoice, priceId);
      await recordStripePurchase(record);
    } catch (error) {
      console.error("[dineleak] stripe invoice webhook record error", error);
      return NextResponse.json({ error: "Failed to record subscription payment." }, { status: 500 });
    }

    const claimed = await claimStripeEvent(event.id, event.type);
    if (!claimed) {
      console.info("[dineleak] stripe webhook duplicate ignored after record", {
        type: event.type,
        id: event.id,
      });
      return NextResponse.json({ received: true, duplicate: true });
    }
  } else if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;

    try {
      const fullSubscription = await stripe.subscriptions.retrieve(subscription.id, {
        expand: ["items.data.price"],
      });
      await upsertMonitoringSubscriptionFromStripeSubscription(fullSubscription);
    } catch (error) {
      console.error("[dineleak] stripe subscription webhook record error", error);
      return NextResponse.json({ error: "Failed to sync subscription." }, { status: 500 });
    }

    const claimed = await claimStripeEvent(event.id, event.type);
    if (!claimed) {
      console.info("[dineleak] stripe webhook duplicate ignored after record", {
        type: event.type,
        id: event.id,
      });
      return NextResponse.json({ received: true, duplicate: true });
    }
  } else {
    console.info("[dineleak] stripe webhook ignored", {
      type: event.type,
      id: event.id,
    });
  }

  return NextResponse.json({ received: true });
}
