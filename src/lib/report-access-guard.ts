import { randomUUID } from "node:crypto";
import { getSql, isDatabaseConfigured } from "@/lib/database";
import { ensureDineLeakDatabaseSchema } from "@/lib/database-schema";
import { getClientIpFromRequest, hashScanIp } from "@/lib/scan-guard";

const WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_LIMIT = 20;

declare global {
  var __dineleakReportLookupAttempts: Map<string, number[]> | undefined;
}

function logGuard(message: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.info("[dineleak] report lookup guard", details ? { message, ...details } : { message });
  }
}

async function ensureMemoryBucket(ipHash: string) {
  globalThis.__dineleakReportLookupAttempts ??= new Map<string, number[]>();
  const now = Date.now();
  const attempts = globalThis.__dineleakReportLookupAttempts.get(ipHash) ?? [];
  const recentAttempts = attempts.filter((timestamp) => now - timestamp < WINDOW_MS);
  globalThis.__dineleakReportLookupAttempts.set(ipHash, recentAttempts);
  return recentAttempts;
}

export function getReportLookupIpHash(request: Request) {
  return hashScanIp(getClientIpFromRequest(request));
}

export async function recordReportLookupAttempt(ipHash: string, email?: string | null) {
  const emailNorm = email?.trim().toLowerCase() ?? "";

  try {
    const sql = getSql();
    if (sql) {
      await ensureDineLeakDatabaseSchema();
      await sql`
        INSERT INTO dineintel_report_lookup_requests (
          request_id,
          ip_hash,
          email_norm,
          route,
          created_at
        )
        VALUES (
          ${randomUUID()},
          ${ipHash},
          ${emailNorm || null},
          ${"reports"},
          NOW()
        )
      `;
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      const recentAttempts = await ensureMemoryBucket(ipHash);
      recentAttempts.push(Date.now());
    }
  } catch (error) {
    logGuard("report lookup record failed", {
      message: error instanceof Error ? error.message : String(error),
      deploymentEnv: process.env.VERCEL_ENV ?? "unknown",
    });
  }
}

export async function checkReportLookupRateLimit(ipHash: string) {
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();
  const limit = DEFAULT_LIMIT;

  try {
    const sql = getSql();

    if (sql) {
      await ensureDineLeakDatabaseSchema();
      const [row] = await sql`
        SELECT COUNT(*)::int AS count
        FROM dineintel_report_lookup_requests
        WHERE ip_hash = ${ipHash}
          AND created_at >= ${windowStart}
          AND route = 'reports'
      `;

      const attempts = Number(row?.count ?? 0);
      return {
        allowed: attempts <= limit,
        attempts,
        limit,
        retryAfterSeconds: 15 * 60,
      };
    }

    if (process.env.NODE_ENV !== "production") {
      const recentAttempts = await ensureMemoryBucket(ipHash);
      const attempts = recentAttempts.length;
      return {
        allowed: attempts <= limit,
        attempts,
        limit,
        retryAfterSeconds: 15 * 60,
      };
    }
  } catch (error) {
    logGuard("report lookup rate check failed", {
      message: error instanceof Error ? error.message : String(error),
      configured: isDatabaseConfigured(),
      deploymentEnv: process.env.VERCEL_ENV ?? "unknown",
    });
  }

  if (process.env.NODE_ENV === "production") {
    logGuard("database unavailable for report lookup rate limit", {
      configured: isDatabaseConfigured(),
      deploymentEnv: process.env.VERCEL_ENV ?? "unknown",
    });
  }

  return {
    allowed: true,
    attempts: 0,
    limit,
    retryAfterSeconds: 15 * 60,
  };
}
