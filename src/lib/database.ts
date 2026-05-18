import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

type SqlClient = NeonQueryFunction<false, false>;

let sqlClient: SqlClient | null = null;

function getDatabaseUrl() {
  return process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim() || "";
}

export function isDatabaseConfigured() {
  return Boolean(getDatabaseUrl());
}

export function getSql() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) return null;

  sqlClient ??= neon(databaseUrl);
  return sqlClient;
}

export function requireSql(context: string) {
  const sql = getSql();
  if (sql) return sql;

  const message = `DATABASE_URL or POSTGRES_URL is required for ${context}.`;
  if (process.env.NODE_ENV === "production") {
    throw new Error(message);
  }

  console.warn(`[dineleak] ${message}`);
  return null;
}

export async function checkDatabaseConnection() {
  const sql = getSql();
  if (!sql) {
    return {
      ok: false,
      configured: false,
      message: "DATABASE_URL or POSTGRES_URL is not configured.",
    };
  }

  await sql`SELECT 1 AS ok`;

  return {
    ok: true,
    configured: true,
    message: "Database connection healthy.",
  };
}
