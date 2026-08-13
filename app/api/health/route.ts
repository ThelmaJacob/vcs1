import { NextResponse } from "next/server";
import { storageIsTemporary, usingPostgres } from "@/lib/data-store";

export const dynamic = "force-dynamic";

/**
 * Reachable without a session on purpose: it is the only way to tell a missing
 * configuration from a wrong password when the application is already deployed.
 * It reports booleans, never a value.
 */
export async function GET() {
  return NextResponse.json({
    configured: {
      password: Boolean(process.env.APP_PASSWORD),
      sessionSecret: Boolean(process.env.AUTH_SECRET),
      assistant: Boolean(process.env.ANTHROPIC_API_KEY),
      database: Boolean(process.env.DATABASE_URL),
    },
    storage: usingPostgres ? "postgres" : "temporary-file",
    temporary: storageIsTemporary,
  });
}
