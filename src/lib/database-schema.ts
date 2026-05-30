import { requireSql } from "@/lib/database";

let schemaReady: Promise<void> | null = null;

export async function ensureDineLeakDatabaseSchema() {
  const sql = requireSql("database schema setup");
  if (!sql) return false;

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

    await sql`
      CREATE TABLE IF NOT EXISTS dineintel_audits (
        audit_id text PRIMARY KEY,
        subscription_id text,
        scan_type text NOT NULL DEFAULT 'one_time',
        monitoring_plan text,
        previous_audit_id text,
        restaurant_name text NOT NULL,
        restaurant_name_norm text NOT NULL,
        restaurant_website text NOT NULL,
        restaurant_website_norm text NOT NULL,
        restaurant_instagram text,
        restaurant_tiktok text,
        cuisine text,
        city text,
        generated_by text NOT NULL,
        monitoring_json jsonb,
        input_json jsonb NOT NULL,
        website_snapshot_json jsonb NOT NULL,
        result_json jsonb NOT NULL,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS dineintel_audits_restaurant_lookup_idx ON dineintel_audits (restaurant_name_norm, restaurant_website_norm)`;
    await sql`CREATE INDEX IF NOT EXISTS dineintel_audits_subscription_idx ON dineintel_audits (subscription_id, created_at DESC)`;

    await sql`
      CREATE TABLE IF NOT EXISTS dineintel_google_signal_cache (
        cache_key text PRIMARY KEY,
        cache_type text NOT NULL,
        cache_scope text NOT NULL,
        payload_json jsonb NOT NULL,
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS dineintel_google_signal_cache_expires_idx ON dineintel_google_signal_cache (expires_at)`;

    await sql`
      CREATE TABLE IF NOT EXISTS dineintel_scan_requests (
        request_id text PRIMARY KEY,
        ip_hash text NOT NULL,
        restaurant_name_norm text,
        restaurant_website_norm text,
        route text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS dineintel_scan_requests_ip_idx ON dineintel_scan_requests (ip_hash, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS dineintel_scan_requests_restaurant_idx ON dineintel_scan_requests (restaurant_name_norm, restaurant_website_norm, created_at DESC)`;

    await sql`
      CREATE TABLE IF NOT EXISTS dineintel_report_lookup_requests (
        request_id text PRIMARY KEY,
        ip_hash text NOT NULL,
        email_norm text,
        route text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS dineintel_report_lookup_requests_ip_idx ON dineintel_report_lookup_requests (ip_hash, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS dineintel_report_lookup_requests_email_idx ON dineintel_report_lookup_requests (email_norm, created_at DESC)`;

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
  return true;
}
