import { NextResponse } from "next/server";
import { createIssue, ensureSchema, listIssues, usingPostgres } from "@/lib/db";
import { DEMO_ISSUES } from "@/lib/seed";

export const dynamic = "force-dynamic";

/**
 * Idempotent: creates the table if it is missing, then loads the demo records
 * only when the table is empty. Safe to replay — it never overwrites data.
 */
export async function POST() {
  try {
    await ensureSchema();
    const existing = await listIssues();
    if (existing.length > 0) {
      return NextResponse.json({
        seeded: 0,
        total: existing.length,
        backend: usingPostgres ? "postgres" : "json-file",
        message: "Data already present, nothing was written.",
      });
    }
    for (const issue of DEMO_ISSUES) await createIssue(issue);
    const total = (await listIssues()).length;
    return NextResponse.json({
      seeded: DEMO_ISSUES.length,
      total,
      backend: usingPostgres ? "postgres" : "json-file",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Seeding failed" },
      { status: 500 }
    );
  }
}
