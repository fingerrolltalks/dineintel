import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { getSql, isDatabaseConfigured } from "@/lib/database";
import { ensureDineLeakDatabaseSchema } from "@/lib/database-schema";

const WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_LIMIT = 5;

declare global {
  var __dineleakScanAttempts: Map<string, number[]> | undefined;
}

function normalize(value?: string | null) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

function normalizeUrl(value?: string | null) {
  return value?.trim().toLowerCase().replace(/\/$/, "") ?? "";
}

function getScanSecret() {
  return process.env.DINELEAK_SCAN_SECRET?.trim() || process.env.DINELEAK_SHARE_SECRET?.trim() || process.env.STRIPE_SECRET_KEY?.trim() || "dineleak-dev-scan-secret";
}

export function hashScanIp(ip: string) {
  return createHmac("sha256", getScanSecret()).update(ip).digest("base64url");
}

export function getClientIpFromRequest(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  const vercelIp = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || vercelIp || cfIp || realIp || "unknown";
}

function logGuard(message: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.info("[dineleak] scan guard", details ? { message, ...details } : { message });
  }
}

function readIntEnv(name: string, defaultValue: number) {
  const raw = process.env[name]?.trim();
  if (!raw) return defaultValue;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

export function getScanRateLimitPerHour() {
  return readIntEnv("SCAN_RATE_LIMIT_PER_HOUR", DEFAULT_LIMIT);
}

export function shouldBypassScanRateLimit(request: Request) {
  const expectedSecret = process.env.DINELEAK_SCAN_SECRET?.trim();
  if (!expectedSecret) return false;

  const providedSecret = request.headers.get("x-dineleak-scan-secret")?.trim() ?? "";
  if (!providedSecret) return false;

  const providedBuffer = Buffer.from(providedSecret);
  const expectedBuffer = Buffer.from(expectedSecret);
  if (providedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(providedBuffer, expectedBuffer);
}

async function ensureMemoryBucket(ipHash: string) {
  globalThis.__dineleakScanAttempts ??= new Map<string, number[]>();
  const now = Date.now();
  const attempts = globalThis.__dineleakScanAttempts.get(ipHash) ?? [];
  const recentAttempts = attempts.filter((timestamp) => now - timestamp < WINDOW_MS);
  globalThis.__dineleakScanAttempts.set(ipHash, recentAttempts);
  return recentAttempts;
}

export async function recordScanAttempt(ipHash: string, restaurantName?: string | null, restaurantWebsite?: string | null) {
  const restaurantNameNorm = normalize(restaurantName);
  const restaurantWebsiteNorm = normalizeUrl(restaurantWebsite);

  try {
    const sql = getSql();
    if (sql) {
      await ensureDineLeakDatabaseSchema();
      await sql`
        INSERT INTO dineintel_scan_requests (
          request_id,
          ip_hash,
          restaurant_name_norm,
          restaurant_website_norm,
          route,
          created_at
        )
        VALUES (
          ${randomUUID()},
          ${ipHash},
          ${restaurantNameNorm || null},
          ${restaurantWebsiteNorm || null},
          ${"audit"},
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
    logGuard("scan attempt record failed", {
      message: error instanceof Error ? error.message : String(error),
      deploymentEnv: process.env.VERCEL_ENV ?? "unknown",
    });
  }
}

export async function checkScanRateLimit(ipHash: string) {
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();
  const limit = getScanRateLimitPerHour();
  try {
    const sql = getSql();

    if (sql) {
      await ensureDineLeakDatabaseSchema();
      const [row] = await sql`
        SELECT COUNT(*)::int AS count
        FROM dineintel_scan_requests
        WHERE ip_hash = ${ipHash}
          AND created_at >= ${windowStart}
          AND route = 'audit'
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
    logGuard("scan rate check failed", {
      message: error instanceof Error ? error.message : String(error),
      configured: isDatabaseConfigured(),
      deploymentEnv: process.env.VERCEL_ENV ?? "unknown",
    });
  }

  if (process.env.NODE_ENV === "production") {
    logGuard("database unavailable for scan rate limit", {
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
