import { NextResponse } from "next/server";
import { storageIsTemporary, usingPostgres } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    storage: usingPostgres ? "postgres" : "temporary-file",
    temporary: storageIsTemporary,
    assistant: Boolean(process.env.ANTHROPIC_API_KEY),
  });
}
