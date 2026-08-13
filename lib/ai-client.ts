import Anthropic from "@anthropic-ai/sdk";
import type { Issue } from "./issue-model";
import { issueVas } from "./issue-model";

export const MODEL = "claude-sonnet-5";

export function anthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}

/** Compact one-line-per-issue digest, cheap enough to send on every question. */
export function digest(issues: Issue[], limit = 400): string {
  return issues
    .slice(0, limit)
    .map((i) =>
      [
        i.id,
        i.title,
        i.country,
        i.divisions.join("/") || "-",
        i.businessArea || "-",
        i.funnelStage || "-",
        i.actionability || "-",
        i.uniqueness,
        i.closed ? "closed" : "open",
        `vas=${issueVas(i) ?? "n/a"}`,
        `updated=${i.lastUpdate}`,
        [i.lead, ...i.team].filter(Boolean).join(" & ") || "-",
      ].join(" | ")
    )
    .join("\n");
}

export const DIGEST_COLUMNS =
  "id | title | country | divisions | business area | funnel stage | actionability | uniqueness | status | value at stake (million EUR) | last update | caretakers";

/** Runs a single forced-tool call and returns the parsed input. */
export async function structured<T>(opts: {
  system: string;
  prompt: string;
  toolName: string;
  toolDescription: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<T> {
  const client = anthropic();
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 2000,
    system: opts.system,
    tools: [
      {
        name: opts.toolName,
        description: opts.toolDescription,
        input_schema: opts.schema as never,
      },
    ],
    tool_choice: { type: "tool", name: opts.toolName },
    messages: [{ role: "user", content: opts.prompt }],
  });

  const block = res.content.find((c) => c.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("The assistant did not return a structured answer");
  }
  return block.input as T;
}
