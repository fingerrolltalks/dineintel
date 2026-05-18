import { NextResponse } from "next/server";
import { checkDatabaseConnection, isDatabaseConfigured } from "@/lib/database";
import { ensureDineLeakDatabaseSchema } from "@/lib/database-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const configuredSecret = process.env.CRON_SECRET?.trim();
  if (!configuredSecret) {
    return process.env.NODE_ENV !== "production";
  }

  return request.headers.get("authorization") === `Bearer ${configuredSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const connection = await checkDatabaseConnection();
    if (!connection.ok) {
      return NextResponse.json(connection, { status: 503 });
    }

    await ensureDineLeakDatabaseSchema();

    return NextResponse.json({ status: "ok", db: "connected" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database health check failed.";
    console.error("[dineleak] database health check failed", message);
    return NextResponse.json(
      {
        ok: false,
        configured: isDatabaseConfigured(),
        schemaReady: false,
        message,
      },
      { status: 500 },
    );
  }
}
