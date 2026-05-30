import { randomUUID } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { AuditInput, AuditResult } from "@/lib/audit";
import { getSql, requireSql } from "@/lib/database";
import type { WebsiteAuditSnapshot } from "@/lib/website-snapshot";

type AuditRecord = {
  auditId: string;
  subscriptionId: string | null;
  scanType: "one_time" | "recurring";
  monitoringPlan: "starter" | "pro" | null;
  previousAuditId: string | null;
  restaurantName: string;
  restaurantWebsite: string;
  restaurantInstagram: string;
  restaurantTikTok: string | null;
  cuisine: string | null;
  city: string | null;
  generatedBy: "openai" | "template";
  createdAt: string;
};

export type StoredAuditRun = {
  auditId: string;
  subscriptionId: string | null;
  scanType: "one_time" | "recurring";
  monitoringPlan: "starter" | "pro" | null;
  previousAuditId: string | null;
  restaurantName: string;
  restaurantWebsite: string;
  createdAt: string;
  generatedBy: "openai" | "template";
  snapshot: WebsiteAuditSnapshot;
  result: AuditResult;
};

let schemaReady: Promise<void> | null = null;

async function ensureSchema() {
  const sql = getSql();
  if (!sql) return;

  schemaReady ??= (async () => {
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
    await sql`ALTER TABLE dineintel_audits ADD COLUMN IF NOT EXISTS subscription_id text`;
    await sql`ALTER TABLE dineintel_audits ADD COLUMN IF NOT EXISTS scan_type text NOT NULL DEFAULT 'one_time'`;
    await sql`ALTER TABLE dineintel_audits ADD COLUMN IF NOT EXISTS monitoring_plan text`;
    await sql`ALTER TABLE dineintel_audits ADD COLUMN IF NOT EXISTS previous_audit_id text`;
    await sql`ALTER TABLE dineintel_audits ADD COLUMN IF NOT EXISTS monitoring_json jsonb`;
    await sql`CREATE INDEX IF NOT EXISTS dineintel_audits_restaurant_lookup_idx ON dineintel_audits (restaurant_name_norm, restaurant_website_norm)`;
    await sql`CREATE INDEX IF NOT EXISTS dineintel_audits_subscription_idx ON dineintel_audits (subscription_id, created_at DESC)`;
  })();

  await schemaReady;
}

function normalize(value?: string | null) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

function normalizeUrl(value?: string | null) {
  return value?.trim().toLowerCase().replace(/\/$/, "") ?? "";
}

async function appendAuditRecord(payload: {
  record: AuditRecord;
  input: AuditInput;
  snapshot: WebsiteAuditSnapshot;
  result: AuditResult;
}) {
  const logPath = join("/tmp", "dineleak", "audit-results.jsonl");
  await mkdir(dirname(logPath), { recursive: true });
  await appendFile(
    logPath,
    `${JSON.stringify({
      ...payload.record,
      input: payload.input,
      snapshot: payload.snapshot,
      result: payload.result,
    })}\n`,
    "utf8",
  );
}

export async function saveAuditRun(payload: {
  input: AuditInput;
  snapshot: WebsiteAuditSnapshot;
  result: AuditResult;
  generatedBy: "openai" | "template";
  subscriptionId?: string | null;
  scanType?: "one_time" | "recurring";
  monitoringPlan?: "starter" | "pro" | null;
  previousAuditId?: string | null;
  monitoring?: AuditResult["monitoring"] | null;
}) {
  const record: AuditRecord = {
    auditId: randomUUID(),
    subscriptionId: payload.subscriptionId ?? null,
    scanType: payload.scanType ?? "one_time",
    monitoringPlan: payload.monitoringPlan ?? null,
    previousAuditId: payload.previousAuditId ?? null,
    restaurantName: payload.input.restaurant,
    restaurantWebsite: payload.input.website,
    restaurantInstagram: payload.input.instagram,
    restaurantTikTok: payload.input.tiktok?.trim() ? payload.input.tiktok : null,
    cuisine: payload.input.cuisine?.trim() ? payload.input.cuisine : null,
    city: payload.input.city?.trim() ? payload.input.city : null,
    generatedBy: payload.generatedBy,
    createdAt: new Date().toISOString(),
  };

  const sql = requireSql("saving audit runs");
  if (sql) {
    await ensureSchema();
    await sql`
      INSERT INTO dineintel_audits (
        audit_id,
        subscription_id,
        scan_type,
        monitoring_plan,
        previous_audit_id,
        restaurant_name,
        restaurant_name_norm,
        restaurant_website,
        restaurant_website_norm,
        restaurant_instagram,
        restaurant_tiktok,
        cuisine,
        city,
        generated_by,
        monitoring_json,
        input_json,
        website_snapshot_json,
        result_json,
        created_at,
        updated_at
      )
      VALUES (
        ${record.auditId},
        ${record.subscriptionId},
        ${record.scanType},
        ${record.monitoringPlan},
        ${record.previousAuditId},
        ${record.restaurantName},
        ${normalize(record.restaurantName)},
        ${record.restaurantWebsite},
        ${normalizeUrl(record.restaurantWebsite)},
        ${record.restaurantInstagram},
        ${record.restaurantTikTok},
        ${record.cuisine},
        ${record.city},
        ${record.generatedBy},
        ${JSON.stringify(payload.monitoring ?? payload.result.monitoring ?? null)},
        ${JSON.stringify(payload.input)},
        ${JSON.stringify(payload.snapshot)},
        ${JSON.stringify(payload.result)},
        ${record.createdAt},
        NOW()
      )
      ON CONFLICT (audit_id) DO UPDATE SET
        subscription_id = EXCLUDED.subscription_id,
        scan_type = EXCLUDED.scan_type,
        monitoring_plan = EXCLUDED.monitoring_plan,
        previous_audit_id = EXCLUDED.previous_audit_id,
        restaurant_name = EXCLUDED.restaurant_name,
        restaurant_name_norm = EXCLUDED.restaurant_name_norm,
        restaurant_website = EXCLUDED.restaurant_website,
        restaurant_website_norm = EXCLUDED.restaurant_website_norm,
        restaurant_instagram = EXCLUDED.restaurant_instagram,
        restaurant_tiktok = EXCLUDED.restaurant_tiktok,
        cuisine = EXCLUDED.cuisine,
        city = EXCLUDED.city,
        generated_by = EXCLUDED.generated_by,
        monitoring_json = EXCLUDED.monitoring_json,
        input_json = EXCLUDED.input_json,
        website_snapshot_json = EXCLUDED.website_snapshot_json,
        result_json = EXCLUDED.result_json,
        updated_at = NOW()
    `;
  }

  await appendAuditRecord({
    record,
    input: payload.input,
    snapshot: payload.snapshot,
    result: payload.result,
  });

  return record;
}

export async function findLatestAuditRunBySubscriptionId(subscriptionId: string): Promise<StoredAuditRun | null> {
  const sql = getSql();
  if (!sql) return null;

  await ensureSchema();
  const [row] = await sql`
    SELECT *
    FROM dineintel_audits
    WHERE subscription_id = ${subscriptionId}
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (!row) return null;

  return {
    auditId: row.audit_id,
    subscriptionId: row.subscription_id,
    scanType: (row.scan_type as "one_time" | "recurring") ?? "one_time",
    monitoringPlan: (row.monitoring_plan as "starter" | "pro" | null) ?? null,
    previousAuditId: row.previous_audit_id ?? null,
    restaurantName: row.restaurant_name,
    restaurantWebsite: row.restaurant_website,
    createdAt: row.created_at,
    generatedBy: row.generated_by,
    snapshot: row.website_snapshot_json as WebsiteAuditSnapshot,
    result: row.result_json as AuditResult,
  };
}

export async function listAuditRunsBySubscriptionId(subscriptionId: string, limit = 12): Promise<StoredAuditRun[]> {
  const sql = getSql();
  if (!sql) return [];

  await ensureSchema();
  const rows = await sql`
    SELECT *
    FROM dineintel_audits
    WHERE subscription_id = ${subscriptionId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    auditId: row.audit_id,
    subscriptionId: row.subscription_id,
    scanType: (row.scan_type as "one_time" | "recurring") ?? "one_time",
    monitoringPlan: (row.monitoring_plan as "starter" | "pro" | null) ?? null,
    previousAuditId: row.previous_audit_id ?? null,
    restaurantName: row.restaurant_name,
    restaurantWebsite: row.restaurant_website,
    createdAt: row.created_at,
    generatedBy: row.generated_by,
    snapshot: row.website_snapshot_json as WebsiteAuditSnapshot,
    result: row.result_json as AuditResult,
  }));
}

export async function findLatestAuditRunByRestaurant(restaurantName: string, restaurantWebsite: string): Promise<StoredAuditRun | null> {
  const sql = getSql();
  if (!sql) return null;

  await ensureSchema();
  const [row] = await sql`
    SELECT *
    FROM dineintel_audits
    WHERE restaurant_name_norm = ${normalize(restaurantName)}
      AND restaurant_website_norm = ${normalizeUrl(restaurantWebsite)}
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (!row) return null;

  return {
    auditId: row.audit_id,
    subscriptionId: row.subscription_id,
    scanType: (row.scan_type as "one_time" | "recurring") ?? "one_time",
    monitoringPlan: (row.monitoring_plan as "starter" | "pro" | null) ?? null,
    previousAuditId: row.previous_audit_id ?? null,
    restaurantName: row.restaurant_name,
    restaurantWebsite: row.restaurant_website,
    createdAt: row.created_at,
    generatedBy: row.generated_by,
    snapshot: row.website_snapshot_json as WebsiteAuditSnapshot,
    result: row.result_json as AuditResult,
  };
}
