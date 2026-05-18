import type Stripe from "stripe";
import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { getSql, requireSql } from "@/lib/database";
import type { CheckoutPlanId } from "@/lib/stripe";
import { upsertMonitoringSubscriptionFromPurchase } from "@/lib/monitoring-storage";

export type StripePurchaseRecord = {
  recordId: string;
  sessionId: string | null;
  invoiceId: string | null;
  subscriptionId: string | null;
  customerEmail: string | null;
  productName: string | null;
  priceId: string | null;
  amountPaid: number;
  paymentStatus: string | null;
  createdAt: string;
  restaurantName: string | null;
  restaurantWebsite: string | null;
  restaurantSocial: string | null;
  restaurantInstagram: string | null;
  restaurantTikTok: string | null;
  restaurantCuisine: string | null;
  restaurantCity: string | null;
  productType: CheckoutPlanId | string | null;
  currency: string | null;
  sourceEvent: "checkout.session.completed" | "invoice.paid";
};

declare global {
  var __dineleakStripePurchases: StripePurchaseRecord[] | undefined;
  var __dineleakStripeEvents: Set<string> | undefined;
}

type PurchaseLookup = {
  sessionId?: string | null;
  customerEmail?: string | null;
  restaurantName?: string | null;
  restaurantWebsite?: string | null;
};

type PurchaseAccess = {
  unlocked: boolean;
  record: StripePurchaseRecord | null;
  matchedBy: string | null;
};

let schemaReady: Promise<void> | null = null;

function normalize(value?: string | null) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

function normalizeUrl(value?: string | null) {
  return value?.trim().toLowerCase().replace(/\/$/, "") ?? "";
}

async function ensureSchema() {
  const sql = getSql();
  if (!sql) return;

  schemaReady ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS dineintel_purchases (
        record_id text PRIMARY KEY,
        session_id text,
        invoice_id text,
        subscription_id text,
        customer_email text,
        customer_email_norm text,
        product_name text,
        price_id text,
        amount_paid integer NOT NULL DEFAULT 0,
        payment_status text,
        created_at timestamptz NOT NULL,
        restaurant_name text,
        restaurant_name_norm text,
        restaurant_website text,
        restaurant_website_norm text,
        restaurant_social text,
        restaurant_instagram text,
        restaurant_tiktok text,
        restaurant_cuisine text,
        restaurant_city text,
        product_type text,
        currency text,
        source_event text,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    await sql`ALTER TABLE dineintel_purchases ADD COLUMN IF NOT EXISTS restaurant_cuisine text`;
    await sql`ALTER TABLE dineintel_purchases ADD COLUMN IF NOT EXISTS restaurant_city text`;
    await sql`CREATE INDEX IF NOT EXISTS dineintel_purchases_customer_email_norm_idx ON dineintel_purchases (customer_email_norm)`;
    await sql`CREATE INDEX IF NOT EXISTS dineintel_purchases_restaurant_lookup_idx ON dineintel_purchases (restaurant_name_norm, restaurant_website_norm)`;
    await sql`CREATE INDEX IF NOT EXISTS dineintel_purchases_product_type_idx ON dineintel_purchases (product_type)`;
    await sql`
      CREATE TABLE IF NOT EXISTS dineintel_stripe_events (
        event_id text PRIMARY KEY,
        event_type text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;
  })();

  await schemaReady;
}

export async function claimStripeEvent(eventId: string, eventType: string) {
  const sql = getSql();

  if (sql) {
    await ensureSchema();
    const [claimed] = await sql`
      INSERT INTO dineintel_stripe_events (event_id, event_type)
      VALUES (${eventId}, ${eventType})
      ON CONFLICT (event_id) DO NOTHING
      RETURNING event_id
    `;

    return Boolean(claimed);
  }

  globalThis.__dineleakStripeEvents ??= new Set<string>();
  if (globalThis.__dineleakStripeEvents.has(eventId)) return false;
  globalThis.__dineleakStripeEvents.add(eventId);
  return true;
}

export function buildPurchaseRecord(
  session: Stripe.Checkout.Session,
  priceId: string | null,
  sourceEvent: StripePurchaseRecord["sourceEvent"] = "checkout.session.completed",
): StripePurchaseRecord {
  const sessionId = session.id;
  return {
    recordId: `session:${sessionId}`,
    sessionId,
    invoiceId: null,
    subscriptionId: typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null,
    customerEmail: session.customer_details?.email ?? session.customer_email ?? null,
    productName: session.metadata?.product_name ?? null,
    priceId,
    amountPaid: typeof session.amount_total === "number" ? session.amount_total : 0,
    paymentStatus: session.payment_status ?? null,
    createdAt: new Date(session.created * 1000).toISOString(),
    restaurantName: session.metadata?.restaurant_name ?? null,
    restaurantWebsite: session.metadata?.restaurant_website ?? null,
    restaurantSocial: session.metadata?.restaurant_social ?? null,
    restaurantInstagram: session.metadata?.restaurant_instagram ?? null,
    restaurantTikTok: session.metadata?.restaurant_tiktok ?? null,
    restaurantCuisine: session.metadata?.restaurant_cuisine ?? null,
    restaurantCity: session.metadata?.restaurant_city ?? null,
    productType: (session.metadata?.selected_product_type as CheckoutPlanId | string | undefined) ?? null,
    currency: session.currency ?? null,
    sourceEvent,
  };
}

export function buildInvoicePurchaseRecord(
  invoice: Stripe.Invoice,
  priceId: string | null,
): StripePurchaseRecord {
  const typedInvoice = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
    paid?: boolean;
  };
  const lineItem = invoice.lines.data[0];
  const subscription = typeof typedInvoice.subscription === "string" ? null : typedInvoice.subscription;
  const metadata = subscription?.metadata ?? invoice.metadata ?? {};
  const productName = lineItem?.description ?? metadata.product_name ?? null;

  return {
    recordId: `invoice:${invoice.id}`,
    sessionId: null,
    invoiceId: invoice.id,
    subscriptionId: typeof typedInvoice.subscription === "string" ? typedInvoice.subscription : typedInvoice.subscription?.id ?? null,
    customerEmail: invoice.customer_email ?? null,
    productName,
    priceId,
    amountPaid: typeof invoice.amount_paid === "number" ? invoice.amount_paid : 0,
    paymentStatus: typedInvoice.paid ? "paid" : invoice.status ?? null,
    createdAt: new Date(invoice.created * 1000).toISOString(),
    restaurantName: metadata.restaurant_name ?? null,
    restaurantWebsite: metadata.restaurant_website ?? null,
    restaurantSocial: metadata.restaurant_social ?? null,
    restaurantInstagram: metadata.restaurant_instagram ?? null,
    restaurantTikTok: metadata.restaurant_tiktok ?? null,
    restaurantCuisine: metadata.restaurant_cuisine ?? null,
    restaurantCity: metadata.restaurant_city ?? null,
    productType: (metadata.selected_product_type as CheckoutPlanId | string | undefined) ?? null,
    currency: invoice.currency ?? null,
    sourceEvent: "invoice.paid",
  };
}

const purchaseLogPath = join("/tmp", "dineleak", "stripe-purchases.jsonl");

async function appendPurchaseRecord(record: StripePurchaseRecord) {
  await mkdir(dirname(purchaseLogPath), { recursive: true });
  await appendFile(purchaseLogPath, `${JSON.stringify(record)}\n`, "utf8");
}

async function writePurchaseToDatabase(record: StripePurchaseRecord) {
  const sql = requireSql("recording Stripe purchases");
  if (!sql) return false;

  await ensureSchema();
  await sql`
    INSERT INTO dineintel_purchases (
      record_id,
      session_id,
      invoice_id,
      subscription_id,
      customer_email,
      customer_email_norm,
      product_name,
      price_id,
      amount_paid,
      payment_status,
      created_at,
      restaurant_name,
      restaurant_name_norm,
      restaurant_website,
      restaurant_website_norm,
      restaurant_social,
      restaurant_instagram,
      restaurant_tiktok,
      restaurant_cuisine,
      restaurant_city,
      product_type,
      currency,
      source_event,
      updated_at
    )
    VALUES (
      ${record.recordId},
      ${record.sessionId},
      ${record.invoiceId},
      ${record.subscriptionId},
      ${record.customerEmail},
      ${normalize(record.customerEmail)},
      ${record.productName},
      ${record.priceId},
      ${record.amountPaid},
      ${record.paymentStatus},
      ${record.createdAt},
      ${record.restaurantName},
      ${normalize(record.restaurantName)},
      ${record.restaurantWebsite},
      ${normalizeUrl(record.restaurantWebsite)},
      ${record.restaurantSocial},
      ${record.restaurantInstagram},
      ${record.restaurantTikTok},
      ${record.restaurantCuisine},
      ${record.restaurantCity},
      ${record.productType},
      ${record.currency},
      ${record.sourceEvent},
      NOW()
    )
    ON CONFLICT (record_id) DO UPDATE SET
      session_id = EXCLUDED.session_id,
      invoice_id = EXCLUDED.invoice_id,
      subscription_id = EXCLUDED.subscription_id,
      customer_email = EXCLUDED.customer_email,
      customer_email_norm = EXCLUDED.customer_email_norm,
      product_name = EXCLUDED.product_name,
      price_id = EXCLUDED.price_id,
      amount_paid = EXCLUDED.amount_paid,
      payment_status = EXCLUDED.payment_status,
      created_at = EXCLUDED.created_at,
      restaurant_name = EXCLUDED.restaurant_name,
      restaurant_name_norm = EXCLUDED.restaurant_name_norm,
      restaurant_website = EXCLUDED.restaurant_website,
      restaurant_website_norm = EXCLUDED.restaurant_website_norm,
      restaurant_social = EXCLUDED.restaurant_social,
      restaurant_instagram = EXCLUDED.restaurant_instagram,
      restaurant_tiktok = EXCLUDED.restaurant_tiktok,
      restaurant_cuisine = EXCLUDED.restaurant_cuisine,
      restaurant_city = EXCLUDED.restaurant_city,
      product_type = EXCLUDED.product_type,
      currency = EXCLUDED.currency,
      source_event = EXCLUDED.source_event,
      updated_at = NOW()
  `;

  return true;
}

export async function recordStripePurchase(record: StripePurchaseRecord) {
  console.info("[dineleak] stripe purchase recorded", record);
  await writePurchaseToDatabase(record);
  await appendPurchaseRecord(record);
  await upsertMonitoringSubscriptionFromPurchase(record);

  if (process.env.NODE_ENV !== "production") {
    globalThis.__dineleakStripePurchases ??= [];
    globalThis.__dineleakStripePurchases.push(record);
  }
}

export async function findReportPurchase(lookup: PurchaseLookup): Promise<PurchaseAccess> {
  const sql = getSql();
  const normalizedEmail = normalize(lookup.customerEmail);
  const normalizedRestaurantName = normalize(lookup.restaurantName);
  const normalizedWebsite = normalizeUrl(lookup.restaurantWebsite);

  if (sql) {
    await ensureSchema();

    const [record] = await sql`
      SELECT *
      FROM dineintel_purchases
      WHERE product_type = 'report'
        AND payment_status IS NOT NULL
        AND payment_status IN ('paid', 'complete', 'succeeded')
        AND (
          (${lookup.sessionId ?? null} IS NOT NULL AND session_id = ${lookup.sessionId ?? null})
          OR (${normalizedEmail} <> '' AND customer_email_norm = ${normalizedEmail})
          OR (${normalizedRestaurantName} <> '' AND restaurant_name_norm = ${normalizedRestaurantName} AND restaurant_website_norm = ${normalizedWebsite})
        )
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (record) {
      return {
        unlocked: true,
        matchedBy: record.session_id ? "session" : record.customer_email ? "email" : "restaurant",
        record: {
          recordId: record.record_id,
          sessionId: record.session_id,
          invoiceId: record.invoice_id,
          subscriptionId: record.subscription_id,
          customerEmail: record.customer_email,
          productName: record.product_name,
          priceId: record.price_id,
          amountPaid: record.amount_paid,
          paymentStatus: record.payment_status,
          createdAt: record.created_at,
          restaurantName: record.restaurant_name,
          restaurantWebsite: record.restaurant_website,
          restaurantSocial: record.restaurant_social,
          restaurantInstagram: record.restaurant_instagram,
          restaurantTikTok: record.restaurant_tiktok,
          restaurantCuisine: record.restaurant_cuisine,
          restaurantCity: record.restaurant_city,
          productType: record.product_type,
          currency: record.currency,
          sourceEvent: record.source_event as StripePurchaseRecord["sourceEvent"],
        },
      };
    }
  }

  const fallbackRecord = (globalThis.__dineleakStripePurchases ?? []).find((record) => {
    if (record.productType !== "report") return false;
    if (record.paymentStatus && !["paid", "complete", "succeeded"].includes(record.paymentStatus)) return false;
    if (lookup.sessionId && record.sessionId === lookup.sessionId) return true;
    if (normalizedEmail && normalize(record.customerEmail) === normalizedEmail) return true;
    if (normalizedRestaurantName && normalize(record.restaurantName) === normalizedRestaurantName && normalizeUrl(record.restaurantWebsite) === normalizedWebsite) {
      return true;
    }
    return false;
  });

  return fallbackRecord
    ? {
        unlocked: true,
        matchedBy: lookup.sessionId && fallbackRecord.sessionId === lookup.sessionId ? "session" : "memory",
      record: fallbackRecord,
    }
    : { unlocked: false, matchedBy: null, record: null };
}
