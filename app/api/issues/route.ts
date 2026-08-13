import { NextResponse } from "next/server";
import { createIssue, listIssues } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ issues: await listIssues() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not load the issues" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({ issue: await createIssue(body) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not create the issue" },
      { status: 500 }
    );
  }
}
