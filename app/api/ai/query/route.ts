import { NextResponse } from "next/server";
import { listIssues } from "@/lib/db";
import { DIGEST_COLUMNS, digest, structured } from "@/lib/ai";
import {
  ACTIONABILITIES,
  BUSINESS_AREAS,
  DIVISIONS,
  FUNNEL_STAGES,
  UNIQUENESS,
} from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

interface Answer {
  answer: string;
  issueIds: string[];
  filters?: {
    country?: string;
    division?: string;
    status?: "open" | "closed" | "all";
    keywords?: string;
    sort?: string;
  };
}

const SYSTEM = `You are the assistant of the Public Affairs Value Capture System (VCS), an issue-tracking application.
You answer questions about the issue portfolio and you pick which issues the user should see.

Rules:
- Answer only from the issue list you are given. Never invent an issue, a figure or a person.
- If the list does not contain the answer, say so plainly.
- Keep answers short: two or three sentences, no preamble, no bullet lists unless you are comparing more than three issues.
- Value at Stake is expressed in million EUR. A positive value is upside, a negative value is downside.
- issueIds must contain the ids of every issue relevant to the question, most relevant first. Leave it empty when the question is not about specific issues.
- Use filters only when the user is clearly asking to narrow the view (a country, a division, open or closed).

Reference values:
- Divisions: ${DIVISIONS.map((d) => `${d.code} (${d.label})`).join(", ")}
- Funnel stages: ${FUNNEL_STAGES.join(", ")}
- Actionability: ${ACTIONABILITIES.join(", ")}
- Uniqueness: ${UNIQUENESS.join(", ")}
- Business areas: ${BUSINESS_AREAS.join(", ")}`;

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    if (typeof question !== "string" || !question.trim()) {
      return NextResponse.json({ error: "Empty question" }, { status: 400 });
    }

    const issues = await listIssues();

    const result = await structured<Answer>({
      system: SYSTEM,
      prompt: `Issue list (${DIGEST_COLUMNS}):\n${digest(issues)}\n\nToday is ${new Date()
        .toISOString()
        .slice(0, 10)}.\n\nQuestion: ${question}`,
      toolName: "reply",
      toolDescription: "Answer the question and select the issues to display.",
      schema: {
        type: "object",
        properties: {
          answer: { type: "string", description: "The answer, two or three sentences." },
          issueIds: {
            type: "array",
            items: { type: "string" },
            description: "Ids of the relevant issues, most relevant first.",
          },
          filters: {
            type: "object",
            properties: {
              country: { type: "string" },
              division: { type: "string", enum: DIVISIONS.map((d) => d.code) },
              status: { type: "string", enum: ["open", "closed", "all"] },
              keywords: { type: "string" },
            },
          },
        },
        required: ["answer", "issueIds"],
      },
    });

    const known = new Set(issues.map((i) => i.id));
    return NextResponse.json({
      answer: result.answer,
      issueIds: (result.issueIds ?? []).filter((id) => known.has(id)),
      filters: result.filters ?? {},
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "The assistant is unavailable" },
      { status: 500 }
    );
  }
}
