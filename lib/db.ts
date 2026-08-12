import { promises as fs } from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { BLANK_ISSUE, EMPTY_ASSESSMENTS, type Issue } from "./types";

/**
 * Two interchangeable backends behind one interface:
 *  - Postgres as soon as DATABASE_URL is set (Supabase, Neon, Vercel Postgres…)
 *  - a JSON file otherwise, so the app runs locally before a database exists.
 * The JSON backend is for local work only: Vercel's filesystem is ephemeral.
 */

// On Vercel the project directory is read-only; /tmp is the only writable path,
// and it is wiped between instances. That is fine for a look-around, never for
// real records — the UI says so out loud when DATABASE_URL is missing.
const FILE = process.env.VERCEL
  ? path.join("/tmp", "ake-vcs", "issues.json")
  : path.join(process.cwd(), ".data", "issues.json");

export const usingPostgres = Boolean(process.env.DATABASE_URL);
export const storageIsTemporary = !usingPostgres;

let pool: Pool | null = null;
function pg(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("localhost")
        ? undefined
        : { rejectUnauthorized: false },
      max: 3,
    });
  }
  return pool;
}

const COLUMNS = `id, issue_no, title, country, lead, team, description, divisions, lead_division,
  business_area, actionability, funnel_stage, uniqueness, assessments, qualitative_impact,
  financial_impact_driver, worst_case_risk, worst_case_sales_value, worst_case_cash_flow,
  best_case_opportunity, best_case_sales_value, best_case_cash_flow, closed,
  closure_impact_type, closure_driver, closure_date, closure_description,
  closure_sales_value, closure_cash_flow, attachments, locked, created_at,
  last_update, last_update_by`;

type Row = Record<string, unknown>;

const num = (v: unknown): number | null =>
  v === null || v === undefined || v === "" ? null : Number(v);
const day = (v: unknown): string =>
  v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? "");

function toIssue(r: Row): Issue {
  return {
    id: String(r.id),
    issueNo: Number(r.issue_no),
    title: String(r.title ?? ""),
    country: String(r.country ?? ""),
    lead: String(r.lead ?? ""),
    team: (r.team as string[]) ?? [],
    description: String(r.description ?? ""),
    divisions: ((r.divisions as string[]) ?? []) as Issue["divisions"],
    leadDivision: (r.lead_division as Issue["leadDivision"]) ?? null,
    businessArea: String(r.business_area ?? "") as Issue["businessArea"],
    actionability: String(r.actionability ?? "") as Issue["actionability"],
    funnelStage: String(r.funnel_stage ?? "") as Issue["funnelStage"],
    uniqueness: (String(r.uniqueness || "No Value Selected") as Issue["uniqueness"]),
    assessments: (r.assessments as Issue["assessments"]) ?? EMPTY_ASSESSMENTS,
    qualitativeImpact: String(r.qualitative_impact ?? "") as Issue["qualitativeImpact"],
    financialImpactDriver: String(
      r.financial_impact_driver ?? ""
    ) as Issue["financialImpactDriver"],
    worstCaseRisk: String(r.worst_case_risk ?? ""),
    worstCaseSalesValue: num(r.worst_case_sales_value),
    worstCaseCashFlow: num(r.worst_case_cash_flow),
    bestCaseOpportunity: String(r.best_case_opportunity ?? ""),
    bestCaseSalesValue: num(r.best_case_sales_value),
    bestCaseCashFlow: num(r.best_case_cash_flow),
    closed: Boolean(r.closed),
    closureImpactType: String(r.closure_impact_type ?? "") as Issue["closureImpactType"],
    closureDriver: String(r.closure_driver ?? "") as Issue["closureDriver"],
    closureDate: r.closure_date ? day(r.closure_date) : null,
    closureDescription: String(r.closure_description ?? ""),
    closureSalesValue: num(r.closure_sales_value),
    closureCashFlow: num(r.closure_cash_flow),
    attachments: (r.attachments as Issue["attachments"]) ?? [],
    locked: Boolean(r.locked),
    createdAt: r.created_at ? new Date(r.created_at as string).toISOString() : "",
    lastUpdate: day(r.last_update),
    lastUpdateBy: String(r.last_update_by ?? ""),
  };
}

/** Column name → value, for the fields a caller is allowed to write. */
const WRITABLE: [string, keyof Issue][] = [
  ["title", "title"],
  ["country", "country"],
  ["lead", "lead"],
  ["team", "team"],
  ["description", "description"],
  ["divisions", "divisions"],
  ["lead_division", "leadDivision"],
  ["business_area", "businessArea"],
  ["actionability", "actionability"],
  ["funnel_stage", "funnelStage"],
  ["uniqueness", "uniqueness"],
  ["assessments", "assessments"],
  ["qualitative_impact", "qualitativeImpact"],
  ["financial_impact_driver", "financialImpactDriver"],
  ["worst_case_risk", "worstCaseRisk"],
  ["worst_case_sales_value", "worstCaseSalesValue"],
  ["worst_case_cash_flow", "worstCaseCashFlow"],
  ["best_case_opportunity", "bestCaseOpportunity"],
  ["best_case_sales_value", "bestCaseSalesValue"],
  ["best_case_cash_flow", "bestCaseCashFlow"],
  ["closed", "closed"],
  ["closure_impact_type", "closureImpactType"],
  ["closure_driver", "closureDriver"],
  ["closure_date", "closureDate"],
  ["closure_description", "closureDescription"],
  ["closure_sales_value", "closureSalesValue"],
  ["closure_cash_flow", "closureCashFlow"],
  ["attachments", "attachments"],
  ["locked", "locked"],
  ["last_update", "lastUpdate"],
  ["last_update_by", "lastUpdateBy"],
];

const JSONB = new Set(["assessments", "attachments"]);

function encode(column: string, v: unknown): unknown {
  return JSONB.has(column) ? JSON.stringify(v ?? null) : v;
}

/* ---------- JSON file backend ---------- */

/** Guarantees every field is present, whatever the stored record looks like. */
function complete(i: Partial<Issue>): Issue {
  return { ...BLANK_ISSUE, ...i } as Issue;
}

async function readFile(): Promise<Issue[]> {
  try {
    const raw = JSON.parse(await fs.readFile(FILE, "utf8")) as Partial<Issue>[];
    return raw.map(complete);
  } catch {
    return [];
  }
}

async function writeFile(issues: Issue[]): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(issues, null, 2));
}

/* ---------- schema ---------- */

const DDL = `
create extension if not exists "pgcrypto";

create table if not exists ake_issues (
  id                      uuid primary key default gen_random_uuid(),
  issue_no                integer not null,
  title                   text not null,
  country                 text not null default '',
  lead                    text not null default '',
  team                    text[] not null default '{}',
  description             text not null default '',
  divisions               text[] not null default '{}',
  lead_division           text,
  business_area           text not null default '',
  actionability           text not null default '',
  funnel_stage            text not null default '',
  uniqueness              text not null default 'No Value Selected',
  assessments             jsonb not null default '{}'::jsonb,
  qualitative_impact      text not null default '',
  financial_impact_driver text not null default '',
  worst_case_risk         text not null default '',
  worst_case_sales_value  numeric,
  worst_case_cash_flow    numeric,
  best_case_opportunity   text not null default '',
  best_case_sales_value   numeric,
  best_case_cash_flow     numeric,
  closed                  boolean not null default false,
  closure_impact_type     text not null default '',
  closure_driver          text not null default '',
  closure_date            date,
  closure_description     text not null default '',
  closure_sales_value     numeric,
  closure_cash_flow       numeric,
  attachments             jsonb not null default '[]'::jsonb,
  locked                  boolean not null default false,
  created_at              timestamptz not null default now(),
  last_update             date not null default current_date,
  last_update_by          text not null default ''
);

create index if not exists ake_issues_country_idx on ake_issues (country);
create index if not exists ake_issues_closed_idx  on ake_issues (closed);
create index if not exists ake_issues_stage_idx   on ake_issues (funnel_stage);
create unique index if not exists ake_issues_no_idx on ake_issues (issue_no);
`;

/** Creates the table when it is missing. Safe to replay. */
export async function ensureSchema(): Promise<void> {
  if (!usingPostgres) return;
  await pg().query(DDL);
}

/* ---------- public API ---------- */

export async function listIssues(): Promise<Issue[]> {
  if (!usingPostgres) {
    return (await readFile()).sort((a, b) => a.title.localeCompare(b.title));
  }
  const { rows } = await pg().query(`select ${COLUMNS} from ake_issues order by title asc`);
  return rows.map(toIssue);
}

export async function createIssue(patch: Partial<Issue>): Promise<Issue> {
  const today = new Date().toISOString().slice(0, 10);
  const base: Partial<Issue> = {
    ...BLANK_ISSUE,
    assessments: EMPTY_ASSESSMENTS,
    ...patch,
    // an explicit date survives (used when loading demo records), otherwise today
    lastUpdate: patch.lastUpdate || today,
    lastUpdateBy: patch.lastUpdateBy || "Demo User",
  };

  if (!usingPostgres) {
    const issues = await readFile();
    const issue: Issue = {
      ...complete(base),
      id: crypto.randomUUID(),
      issueNo: Math.max(1000, ...issues.map((i) => i.issueNo)) + 1,
      createdAt: new Date().toISOString(),
    };
    await writeFile([...issues, issue]);
    return issue;
  }

  const cols: string[] = [];
  const values: unknown[] = [];
  for (const [col, key] of WRITABLE) {
    if (base[key] === undefined) continue;
    cols.push(col);
    values.push(encode(col, base[key]));
  }
  const placeholders = cols.map((_, idx) => `$${idx + 1}`);
  const { rows } = await pg().query(
    `insert into ake_issues (issue_no, ${cols.join(", ")})
     values ((select coalesce(max(issue_no), 1000) + 1 from ake_issues), ${placeholders.join(", ")})
     returning ${COLUMNS}`,
    values
  );
  return toIssue(rows[0]);
}

export async function updateIssue(id: string, patch: Partial<Issue>): Promise<Issue | null> {
  const next: Partial<Issue> = {
    ...patch,
    lastUpdate: new Date().toISOString().slice(0, 10),
    lastUpdateBy: patch.lastUpdateBy || "Demo User",
  };

  if (!usingPostgres) {
    const issues = await readFile();
    const idx = issues.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    issues[idx] = complete({ ...issues[idx], ...next, id, issueNo: issues[idx].issueNo });
    await writeFile(issues);
    return issues[idx];
  }

  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [col, key] of WRITABLE) {
    if (next[key] === undefined) continue;
    values.push(encode(col, next[key]));
    sets.push(`${col} = $${values.length}`);
  }
  if (!sets.length) return null;
  values.push(id);
  const { rows } = await pg().query(
    `update ake_issues set ${sets.join(", ")} where id = $${values.length} returning ${COLUMNS}`,
    values
  );
  return rows[0] ? toIssue(rows[0]) : null;
}

export async function deleteIssue(id: string): Promise<boolean> {
  if (!usingPostgres) {
    const issues = await readFile();
    const next = issues.filter((i) => i.id !== id);
    await writeFile(next);
    return next.length !== issues.length;
  }
  const res = await pg().query("delete from ake_issues where id = $1", [id]);
  return (res.rowCount ?? 0) > 0;
}

export async function replaceAll(issues: Issue[]): Promise<void> {
  if (!usingPostgres) {
    await writeFile(issues);
    return;
  }
  await pg().query("delete from ake_issues");
  for (const i of issues) {
    await createIssue(i);
  }
}
