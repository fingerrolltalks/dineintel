import { getSql, requireSql } from "@/lib/database";
import type { StripePurchaseRecord } from "@/lib/stripe-purchase-log";

type MonitoringPlan = "starter" | "pro";

export type RecurringMonitoringSubscription = {
  subscriptionId: string;
  productType: MonitoringPlan;
  priceId: string | null;
  customerEmail: string | null;
  restaurantName: string | null;
  restaurantWebsite: string | null;
  restaurantSocial: string | null;
  restaurantInstagram: string | null;
  restaurantTikTok: string | null;
  cuisine: string | null;
  city: string | null;
  intervalDays: number;
  nextScanAt: string;
  lastScanAt: string | null;
  lastAttemptAt: string | null;
  lastAuditId: string | null;
  stripeStatus: string | null;
  active: boolean;
  scanCount: number;
  retryCount: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

let schemaReady: Promise<void> | null = null;

function normalize(value?: string | null) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

function normalizeUrl(value?: string | null) {
  return value?.trim().toLowerCase().replace(/\/$/, "") ?? "";
}

function planIntervalDays(plan: MonitoringPlan) {
  return plan === "pro" ? 7 : 30;
}

function toMonitoringSubscription(row: Record<string, unknown>): RecurringMonitoringSubscription {
  return {
    subscriptionId: String(row.subscription_id ?? ""),
    productType: String(row.product_type ?? "starter") as MonitoringPlan,
    priceId: (row.price_id as string | null) ?? null,
    customerEmail: (row.customer_email as string | null) ?? null,
    restaurantName: (row.restaurant_name as string | null) ?? null,
    restaurantWebsite: (row.restaurant_website as string | null) ?? null,
    restaurantSocial: (row.restaurant_social as string | null) ?? null,
    restaurantInstagram: (row.restaurant_instagram as string | null) ?? null,
    restaurantTikTok: (row.restaurant_tiktok as string | null) ?? null,
    cuisine: (row.cuisine as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    intervalDays: Number(row.interval_days ?? 30),
    nextScanAt: String(row.next_scan_at ?? new Date().toISOString()),
    lastScanAt: (row.last_scan_at as string | null) ?? null,
    lastAttemptAt: (row.last_attempt_at as string | null) ?? null,
    lastAuditId: (row.last_audit_id as string | null) ?? null,
    stripeStatus: (row.stripe_status as string | null) ?? null,
    active: Boolean(row.active),
    scanCount: Number(row.scan_count ?? 0),
    retryCount: Number(row.retry_count ?? 0),
    lastError: (row.last_error as string | null) ?? null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

async function ensureSchema() {
  const sql = getSql();
  if (!sql) return;

  schemaReady ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS dineintel_monitoring_subscriptions (
        subscription_id text PRIMARY KEY,
        product_type text NOT NULL,
        price_id text,
        customer_email text,
        customer_email_norm text,
        restaurant_name text,
        restaurant_name_norm text,
        restaurant_website text,
        restaurant_website_norm text,
        restaurant_social text,
        restaurant_instagram text,
        restaurant_tiktok text,
        cuisine text,
        city text,
        interval_days integer NOT NULL,
        next_scan_at timestamptz NOT NULL,
        last_scan_at timestamptz,
        last_attempt_at timestamptz,
        last_audit_id text,
        stripe_status text,
        active boolean NOT NULL DEFAULT true,
        scan_count integer NOT NULL DEFAULT 0,
        retry_count integer NOT NULL DEFAULT 0,
        last_error text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    await sql`ALTER TABLE dineintel_monitoring_subscriptions ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz`;
    await sql`ALTER TABLE dineintel_monitoring_subscriptions ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0`;
    await sql`CREATE INDEX IF NOT EXISTS dineintel_monitoring_due_idx ON dineintel_monitoring_subscriptions (active, next_scan_at)`;
    await sql`CREATE INDEX IF NOT EXISTS dineintel_monitoring_restaurant_idx ON dineintel_monitoring_subscriptions (restaurant_name_norm, restaurant_website_norm)`;
  })();

  await schemaReady;
}

export async function upsertMonitoringSubscriptionFromPurchase(record: StripePurchaseRecord) {
  if (!record.subscriptionId || !record.productType || !["starter", "pro"].includes(record.productType)) {
    return null;
  }

  const plan = record.productType as MonitoringPlan;
  const sql = requireSql("creating recurring monitoring subscriptions");
  if (!sql) return null;

  await ensureSchema();

  const nextScanAt = new Date(Date.now() + planIntervalDays(plan) * 24 * 60 * 60 * 1000).toISOString();
  const [row] = await sql`
    INSERT INTO dineintel_monitoring_subscriptions (
      subscription_id,
      product_type,
      price_id,
      customer_email,
      customer_email_norm,
      restaurant_name,
      restaurant_name_norm,
      restaurant_website,
      restaurant_website_norm,
      restaurant_social,
      restaurant_instagram,
      restaurant_tiktok,
      cuisine,
      city,
      interval_days,
      next_scan_at,
      last_scan_at,
      last_attempt_at,
      last_audit_id,
      stripe_status,
      active,
      scan_count,
      retry_count,
      last_error,
      created_at,
      updated_at
    )
    VALUES (
      ${record.subscriptionId},
      ${plan},
      ${record.priceId},
      ${record.customerEmail},
      ${normalize(record.customerEmail)},
      ${record.restaurantName},
      ${normalize(record.restaurantName)},
      ${record.restaurantWebsite},
      ${normalizeUrl(record.restaurantWebsite)},
      ${record.restaurantSocial},
      ${record.restaurantInstagram},
      ${record.restaurantTikTok},
      ${record.restaurantCuisine},
      ${record.restaurantCity},
      ${planIntervalDays(plan)},
      ${nextScanAt},
      NULL,
      NULL,
      NULL,
      ${record.paymentStatus ?? "active"},
      true,
      0,
      0,
      NULL,
      NOW(),
      NOW()
    )
    ON CONFLICT (subscription_id) DO UPDATE SET
      product_type = EXCLUDED.product_type,
      price_id = EXCLUDED.price_id,
      customer_email = EXCLUDED.customer_email,
      customer_email_norm = EXCLUDED.customer_email_norm,
      restaurant_name = EXCLUDED.restaurant_name,
      restaurant_name_norm = EXCLUDED.restaurant_name_norm,
      restaurant_website = EXCLUDED.restaurant_website,
      restaurant_website_norm = EXCLUDED.restaurant_website_norm,
      restaurant_social = EXCLUDED.restaurant_social,
      restaurant_instagram = EXCLUDED.restaurant_instagram,
      restaurant_tiktok = EXCLUDED.restaurant_tiktok,
      cuisine = EXCLUDED.cuisine,
      city = EXCLUDED.city,
      interval_days = EXCLUDED.interval_days,
      next_scan_at = CASE
        WHEN dineintel_monitoring_subscriptions.interval_days IS DISTINCT FROM EXCLUDED.interval_days
          THEN EXCLUDED.next_scan_at
        ELSE COALESCE(dineintel_monitoring_subscriptions.next_scan_at, EXCLUDED.next_scan_at)
      END,
      active = true,
      stripe_status = EXCLUDED.stripe_status,
      retry_count = 0,
      updated_at = NOW()
    RETURNING *
  `;

  return row ? toMonitoringSubscription(row as Record<string, unknown>) : null;
}

export async function listDueRecurringSubscriptions(limit = 25) {
  const sql = requireSql("listing due recurring subscriptions");
  if (!sql) return [];

  await ensureSchema();
  const rows = await sql`
    SELECT *
    FROM dineintel_monitoring_subscriptions
    WHERE active = true
      AND next_scan_at <= NOW()
    ORDER BY next_scan_at ASC
    LIMIT ${limit}
  `;

  return rows.map((row) => toMonitoringSubscription(row as Record<string, unknown>));
}

export async function findRecurringSubscription(subscriptionId: string) {
  const sql = getSql();
  if (!sql) return null;

  await ensureSchema();
  const [row] = await sql`
    SELECT *
    FROM dineintel_monitoring_subscriptions
    WHERE subscription_id = ${subscriptionId}
    LIMIT 1
  `;

  return row ? toMonitoringSubscription(row as Record<string, unknown>) : null;
}

export async function markRecurringScanComplete(payload: {
  subscriptionId: string;
  auditId: string;
  stripeStatus: string | null;
  lastScanAt: string;
  nextScanAt: string;
}) {
  const sql = getSql();
  if (!sql) return;

  await ensureSchema();
  await sql`
    UPDATE dineintel_monitoring_subscriptions
    SET
      last_audit_id = ${payload.auditId},
      last_scan_at = ${payload.lastScanAt},
      last_attempt_at = ${payload.lastScanAt},
      next_scan_at = ${payload.nextScanAt},
      stripe_status = ${payload.stripeStatus},
      active = true,
      scan_count = scan_count + 1,
      retry_count = 0,
      last_error = NULL,
      updated_at = NOW()
    WHERE subscription_id = ${payload.subscriptionId}
  `;
}

export async function markRecurringScanFailed(payload: {
  subscriptionId: string;
  error: string;
  stripeStatus?: string | null;
}) {
  const sql = getSql();
  if (!sql) return;

  await ensureSchema();
  await sql`
    UPDATE dineintel_monitoring_subscriptions
    SET
      last_error = ${payload.error},
      last_attempt_at = NOW(),
      retry_count = COALESCE(retry_count, 0) + 1,
      next_scan_at = NOW() + CASE
        WHEN COALESCE(retry_count, 0) = 0 THEN INTERVAL '6 hours'
        WHEN COALESCE(retry_count, 0) = 1 THEN INTERVAL '12 hours'
        ELSE INTERVAL '24 hours'
      END,
      stripe_status = COALESCE(${payload.stripeStatus ?? null}, stripe_status),
      updated_at = NOW()
    WHERE subscription_id = ${payload.subscriptionId}
  `;
}

export async function setRecurringSubscriptionInactive(payload: {
  subscriptionId: string;
  stripeStatus: string | null;
}) {
  const sql = getSql();
  if (!sql) return;

  await ensureSchema();
  await sql`
    UPDATE dineintel_monitoring_subscriptions
    SET
      active = false,
      stripe_status = ${payload.stripeStatus},
      updated_at = NOW()
    WHERE subscription_id = ${payload.subscriptionId}
  `;
}
