import { NextResponse } from "next/server";
import { listIssues } from "@/lib/data-store";
import { digest, structured } from "@/lib/ai-client";
import {
  ACTIONABILITIES,
  BUSINESS_AREAS,
  BUSINESS_UNITS,
  COUNTRIES,
  DIVISIONS,
  FINANCIAL_IMPACT_DRIVERS,
  FUNNEL_STAGES,
  IMPACT_LEVELS,
  UNIQUENESS,
} from "@/lib/issue-model";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SYSTEM = `You help a Public Affairs manager file an issue in the Value Capture System.
From a free-text briefing you propose a value for each field of the issue form.

Rules:
- Propose a value only when the briefing supports it. Leave a field out rather than guessing.
- title: a short, neutral, searchable label. No dates, no adjectives.
- description: three to six sentences of plain factual prose describing what the issue is, who drives it and why it matters.
- worstCaseRisk and bestCaseOpportunity: two to four sentences each, describing the downside and the upside for the company.
- Monetary values are in million EUR. Propose them only if the briefing gives figures or a clear order of magnitude.
- Every monetary value is a positive magnitude. Never propose a negative number. worstCaseSalesValue is how much sales is at risk in the worst case, bestCaseSalesValue is how much is to be gained in the best case. "A downside of 15 million" means worstCaseSalesValue = 15, not -15.
- confidence: "high" when the briefing states it, "medium" when it is a reasonable reading, "low" when you are extrapolating.
- duplicateIds: existing issues that look like the same topic. Be strict: same subject and same country, not merely the same theme.
- notes: what is still missing for the record to be complete. One short sentence per gap, at most three.
- Never invent people's names.`;

interface Fill {
  fields: Record<string, unknown>;
  confidence: Record<string, "high" | "medium" | "low">;
  duplicateIds: string[];
  notes: string[];
}

export async function POST(req: Request) {
  try {
    const { briefing, current } = await req.json();
    if (typeof briefing !== "string" || briefing.trim().length < 10) {
      return NextResponse.json(
        { error: "Describe the issue in a sentence or two first." },
        { status: 400 }
      );
    }

    const issues = await listIssues();

    const result = await structured<Fill>({
      maxTokens: 3000,
      system: SYSTEM,
      prompt: `Existing issues (id | title | country | divisions | area | stage | actionability | uniqueness | status | vas | updated | caretakers):
${digest(issues)}

Fields already filled in by the user (do not contradict them):
${JSON.stringify(current ?? {}, null, 1)}

Briefing from the user:
${briefing}`,
      toolName: "propose_issue",
      toolDescription: "Propose values for the issue form fields.",
      schema: {
        type: "object",
        properties: {
          fields: {
            type: "object",
            properties: {
              title: { type: "string" },
              country: { type: "string", enum: COUNTRIES.map((c) => c.code) },
              description: { type: "string" },
              divisions: {
                type: "array",
                items: { type: "string", enum: DIVISIONS.map((d) => d.code) },
              },
              leadDivision: { type: "string", enum: DIVISIONS.map((d) => d.code) },
              businessArea: { type: "string", enum: [...BUSINESS_AREAS] },
              actionability: { type: "string", enum: [...ACTIONABILITIES] },
              funnelStage: { type: "string", enum: [...FUNNEL_STAGES] },
              uniqueness: { type: "string", enum: [...UNIQUENESS] },
              qualitativeImpact: { type: "string", enum: [...IMPACT_LEVELS] },
              financialImpactDriver: { type: "string", enum: [...FINANCIAL_IMPACT_DRIVERS] },
              businessUnit: { type: "string", enum: [...BUSINESS_UNITS] },
              worstCaseRisk: { type: "string" },
              worstCaseSalesValue: { type: "number" },
              bestCaseOpportunity: { type: "string" },
              bestCaseSalesValue: { type: "number" },
            },
          },
          confidence: {
            type: "object",
            additionalProperties: { type: "string", enum: ["high", "medium", "low"] },
          },
          duplicateIds: { type: "array", items: { type: "string" } },
          notes: { type: "array", items: { type: "string" } },
        },
        required: ["fields", "confidence", "duplicateIds", "notes"],
      },
    });

    const byId = new Map(issues.map((i) => [i.id, i]));
    return NextResponse.json({
      fields: result.fields ?? {},
      confidence: result.confidence ?? {},
      notes: result.notes ?? [],
      duplicates: (result.duplicateIds ?? [])
        .map((id) => byId.get(id))
        .filter(Boolean)
        .map((i) => ({ id: i!.id, title: i!.title, country: i!.country })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "The assistant is unavailable" },
      { status: 500 }
    );
  }
}
