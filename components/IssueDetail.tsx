"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Attach20Regular,
  Delete20Regular,
  DocumentText20Regular,
  Edit20Regular,
  Checkmark20Filled,
  Dismiss20Regular,
  Save20Regular,
} from "@fluentui/react-icons";
import {
  ACTIONABILITIES,
  BUSINESS_AREAS,
  BUSINESS_UNITS,
  COUNTRIES,
  DIVISIONS,
  FINANCIAL_IMPACT_DRIVERS,
  FINANCIAL_IMPACT_DRIVER_HELP,
  FUNNEL_STAGES,
  IMPACT_LEVELS,
  IMPACT_TYPES,
  UNIQUENESS,
  closureBlockers,
  countryName,
  daysSince,
  isStale,
  issueVas,
  scenarioVas,
  tabCompletion,
  type DivisionCode,
  type Issue,
} from "@/lib/types";
import { parsePeople, useStore } from "@/lib/store";
import { Badge, CompletionDot, Money, SectionTitle, Toggle, Value, Vas } from "./ui";

const TABS = ["Definition", "Categorization", "Scenarios", "Closure", "Attachments"] as const;
type Tab = (typeof TABS)[number];

export default function IssueDetail({ issue }: { issue: Issue }) {
  const router = useRouter();
  const { updateIssue, deleteIssue } = useStore();

  const [tab, setTab] = useState<Tab>("Definition");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Issue>(issue);
  const [saving, setSaving] = useState(false);
  const [startingClosure, setStartingClosure] = useState(false);

  useEffect(() => {
    setDraft(issue);
    setEditing(false);
    setStartingClosure(false);
  }, [issue]);

  const value = editing ? draft : issue;
  const completion = tabCompletion(value);
  const set = <K extends keyof Issue>(k: K, v: Issue[K]) => setDraft((d) => ({ ...d, [k]: v }));

  async function save() {
    setSaving(true);
    // lastUpdateBy is stamped by the server: with a shared login we cannot
    // credit the edit to whoever happened to touch the record before.
    const { lastUpdateBy: _ignored, ...patch } = draft;
    await updateIssue(issue.id, patch);
    setSaving(false);
    setEditing(false);
  }

  async function remove() {
    if (!confirm(`Delete “${issue.title}”? This cannot be undone.`)) return;
    if (await deleteIssue(issue.id)) router.push("/table");
  }

  async function closeIssue() {
    setSaving(true);
    const { lastUpdateBy: _ignored, ...patch } = draft;
    await updateIssue(issue.id, { ...patch, closed: true });
    setSaving(false);
    setEditing(false);
    setStartingClosure(false);
  }

  /* ---------- field primitives ---------- */

  const row = (label: string, node: React.ReactNode, span = "") => (
    <div className={span}>
      <div className="label mb-1">{label}</div>
      <div className="text-[13px]">{node}</div>
    </div>
  );

  const text = (k: keyof Issue, label: string, span = "") =>
    row(
      label,
      editing ? (
        <input
          value={String(draft[k] ?? "")}
          onChange={(e) => set(k, e.target.value as never)}
          className="field"
        />
      ) : (
        <span className="block rounded-[3px] bg-muted px-2.5 py-1.5 font-semibold">
          <Value>{String(issue[k] ?? "")}</Value>
        </span>
      ),
      span
    );

  const area = (k: keyof Issue, label: string, rows = 8) =>
    row(
      label,
      editing ? (
        <textarea
          rows={rows}
          value={String(draft[k] ?? "")}
          onChange={(e) => set(k, e.target.value as never)}
          className="field resize-y leading-relaxed"
        />
      ) : String(issue[k] ?? "").trim() ? (
        <div className="rich max-h-[420px] overflow-auto rounded-[3px] border border-line bg-muted/40 p-3 leading-relaxed">
          {String(issue[k]).split("\n\n").map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>
      ) : (
        <span className="italic text-ink-soft/70">To be completed</span>
      )
    );

  const choice = (k: keyof Issue, label: string, options: readonly string[], span = "") =>
    row(
      label,
      editing ? (
        <select
          value={String(draft[k] ?? "")}
          onChange={(e) => set(k, e.target.value as never)}
          className="field cursor-pointer"
        >
          <option value="">Select…</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <span className="block rounded-[3px] bg-muted px-2.5 py-1.5 font-semibold">
          <Value>{String(issue[k] ?? "")}</Value>
        </span>
      ),
      span
    );

  const money = (k: keyof Issue, label: string) =>
    row(
      label,
      editing ? (
        <input
          type="number"
          step="0.01"
          value={draft[k] === null || draft[k] === undefined ? "" : String(draft[k])}
          onChange={(e) => set(k, (e.target.value === "" ? null : Number(e.target.value)) as never)}
          className="field tabular-nums"
        />
      ) : (
        <span className="block rounded-[3px] bg-muted px-2.5 py-1.5">
          <Money value={issue[k] as number | null} />
        </span>
      )
    );

  /* ---------- tabs ---------- */

  const definition = (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        {text("title", "Issue Title *")}
        {row(
          "Country *",
          editing ? (
            <select
              value={draft.country}
              onChange={(e) => set("country", e.target.value)}
              className="field cursor-pointer"
            >
              <option value="">Find items</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="block rounded-[3px] bg-muted px-2.5 py-1.5 font-semibold">
              <Value>{issue.country ? `${issue.country} — ${countryName(issue.country)}` : ""}</Value>
            </span>
          )
        )}
        {text("lead", "Lead *")}
        {row(
          "Team",
          editing ? (
            <input
              value={draft.team.join(", ")}
              onChange={(e) => set("team", parsePeople(e.target.value))}
              className="field"
            />
          ) : issue.team.length ? (
            <span className="flex flex-wrap gap-1.5">
              {issue.team.map((t, idx) => (
                <span key={`${t}-${idx}`} className="rounded-[3px] bg-muted px-2 py-1 font-semibold">
                  {t}
                </span>
              ))}
            </span>
          ) : (
            <span className="italic text-ink-soft/70">To be completed</span>
          )
        )}
      </div>
      {area("description", "Description *", 12)}
    </div>
  );

  const categorization = (
    <div className="space-y-6">
      <div>
        <SectionTitle>Classification</SectionTitle>
        <div className="grid grid-cols-4 gap-5">
          {choice("businessArea", "Business Area", BUSINESS_AREAS)}
          {choice("actionability", "Actionability", ACTIONABILITIES)}
          {choice("funnelStage", "Funnel Stage", FUNNEL_STAGES)}
          {choice("uniqueness", "Uniqueness", UNIQUENESS)}
        </div>
      </div>

      <div>
        <SectionTitle>Impact per division</SectionTitle>
        <table className="w-full">
          <thead>
            <tr className="text-left text-[11.5px] font-semibold uppercase tracking-wide text-ink-soft">
              <th className="w-[22%] pb-2">Division</th>
              <th className="w-[30%] pb-2">Business Unit</th>
              <th className="w-[24%] pb-2">Impact</th>
              <th className="pb-2">
                Policy Pressure Point
                <span className="ml-1 font-normal normal-case">(only relevant for LT)</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {DIVISIONS.map((d) => {
              const a = value.assessments?.[d.code] ?? {
                businessUnit: "Not Applicable",
                impact: "None" as const,
                policyPressurePoint: false,
              };
              const update = (patch: Partial<typeof a>) =>
                set("assessments", {
                  ...draft.assessments,
                  [d.code]: { ...a, ...patch },
                } as Issue["assessments"]);
              return (
                <tr key={d.code} className="border-t border-line">
                  <td className="py-2 pr-3 text-[13px] font-semibold text-navy">{d.label}</td>
                  <td className="py-2 pr-3">
                    {editing ? (
                      <select
                        value={a.businessUnit}
                        onChange={(e) => update({ businessUnit: e.target.value })}
                        className="field cursor-pointer"
                      >
                        {BUSINESS_UNITS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="rounded-[3px] bg-muted px-2 py-1 text-[13px]">
                        {a.businessUnit}
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {editing ? (
                      <select
                        value={a.impact}
                        onChange={(e) => update({ impact: e.target.value as never })}
                        className="field cursor-pointer"
                      >
                        {IMPACT_LEVELS.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="rounded-[3px] bg-muted px-2 py-1 text-[13px]">{a.impact}</span>
                    )}
                  </td>
                  <td className="py-2">
                    <Toggle
                      checked={a.policyPressurePoint}
                      onChange={editing ? (v) => update({ policyPressurePoint: v }) : undefined}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-[1fr_1fr_2fr] gap-6">
        {choice("qualitativeImpact", "Qualitative Impact", IMPACT_LEVELS)}
        {choice("financialImpactDriver", "Financial Impact Driver", FINANCIAL_IMPACT_DRIVERS)}
        <div className="rounded-[4px] border border-line bg-muted/50 p-3">
          <p className="mb-2 text-[11.5px] font-bold uppercase tracking-wide text-ink-soft">
            Financial impact drivers
          </p>
          <dl className="space-y-1 text-[11.5px] leading-snug">
            {FINANCIAL_IMPACT_DRIVERS.map((d) => (
              <div key={d} className="grid grid-cols-[52px_1fr] gap-2">
                <dt className="font-bold text-navy">{d}</dt>
                <dd className="text-ink-soft">{FINANCIAL_IMPACT_DRIVER_HELP[d]}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );

  const scenarios = (
    <div className="space-y-6">
      <div className="grid grid-cols-[1fr_260px] gap-6">
        {area("worstCaseRisk", "Worst Case Risk", 9)}
        <div className="space-y-4 rounded-[4px] border border-line bg-muted/40 p-3">
          {money("worstCaseSalesValue", "Worst Case Sales Value (million EUR)")}
          {money("worstCaseCashFlow", "Worst Case Sales Cash Flow (million EUR, info)")}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_260px] gap-6">
        {area("bestCaseOpportunity", "Best Case Opportunity", 9)}
        <div className="space-y-4 rounded-[4px] border border-line bg-muted/40 p-3">
          {money("bestCaseSalesValue", "Best Case Sales Value (million EUR)")}
          {money("bestCaseCashFlow", "Best Case Sales Cash Flow (million EUR, info)")}
          <div className="border-t border-line pt-3">
            <div className="label mb-1">Scenario Value at Stake</div>
            <Vas value={scenarioVas(value)} size="xl" />
            <p className="mt-1 text-[11px] text-ink-soft">Best case minus worst case.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const blockers = closureBlockers(draft);
  const closureOpen = value.closed || startingClosure;

  const closure = (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-[4px] border border-line bg-muted/50 px-4 py-3">
        <div>
          <p className="text-[13px] font-bold text-navy">
            Issue status: {value.closed ? "Closed" : "Open"}
          </p>
          <p className="text-[12px] text-ink-soft">
            {value.closed
              ? `Closed on ${value.closureDate ?? "—"}. Reopen to edit the captured value.`
              : "Closing an issue records the value actually captured."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Toggle
            checked={value.closed}
            labels={["Open", "Closed"]}
            onChange={(v) => {
              if (!editing) setEditing(true);
              set("closed", v);
              if (v) setStartingClosure(true);
            }}
          />
          {!value.closed && !startingClosure && (
            <button
              onClick={() => {
                setEditing(true);
                setStartingClosure(true);
              }}
              className="btn-ghost"
            >
              Start closure
            </button>
          )}
        </div>
      </div>

      {!closureOpen ? (
        <p className="rounded-[4px] border border-dashed border-line bg-white p-8 text-center text-[13px] italic text-ink-soft">
          The closure fields appear once the closure starts. Nothing to fill in while the issue
          is being worked on.
        </p>
      ) : (
        <div className="grid grid-cols-[1fr_280px] gap-6">
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-5">
              {choice("closureImpactType", "Impact Type", IMPACT_TYPES)}
              {row(
                "Financial Impact Driver in Categorization",
                <span className="block rounded-[3px] bg-muted px-2.5 py-1.5 text-ink-soft">
                  <Value>{issue.financialImpactDriver}</Value>
                </span>
              )}
              {choice("closureDriver", "Financial Impact Driver at Closure", FINANCIAL_IMPACT_DRIVERS)}
            </div>
            {area("closureDescription", "Description", 10)}
          </div>

          <div className="space-y-4 rounded-[4px] border border-line bg-muted/40 p-3">
            {row(
              "Closure Date",
              editing ? (
                <input
                  type="date"
                  value={draft.closureDate ?? ""}
                  onChange={(e) => set("closureDate", e.target.value || null)}
                  className="field"
                />
              ) : (
                <span className="block rounded-[3px] bg-white px-2.5 py-1.5 font-semibold">
                  <Value>{issue.closureDate ?? ""}</Value>
                </span>
              )
            )}
            {money("closureSalesValue", "Sales Value (million EUR)")}
            {money("closureCashFlow", "Sales Cash Flow (million EUR, info)")}

            <div className="border-t border-line pt-3">
              <div className="label mb-1">Cash Flow Value from Scenarios (info)</div>
              <Money value={value.bestCaseCashFlow} />
            </div>

            <div className="border-t border-line pt-3">
              <div className="label mb-1">Value at Stake</div>
              <Vas value={issueVas(value)} size="xl" />
            </div>

            {!issue.closed && (
              <div className="border-t border-line pt-3">
                <button
                  onClick={closeIssue}
                  disabled={blockers.length > 0 || saving}
                  className="btn-green w-full justify-center"
                >
                  <Checkmark20Filled className="h-4 w-4" />
                  Close &amp; Save Issue
                </button>
                {blockers.length > 0 && (
                  <p className="mt-1.5 text-[11.5px] leading-snug text-[#9a6410]">
                    Still required: {blockers.join(", ")}.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const attachments = (
    <div>
      <SectionTitle>Attachments</SectionTitle>
      {issue.attachments.length === 0 ? (
        <p className="rounded-[4px] border border-dashed border-line p-8 text-center text-[13px] italic text-ink-soft">
          No document attached yet.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {issue.attachments.map((a) => (
            <li key={a.name} className="flex items-center gap-3 py-2.5">
              <DocumentText20Regular className="h-5 w-5 shrink-0 text-navy" />
              <span className="flex-1 text-[13px] font-semibold text-navy">{a.name}</span>
              <span className="text-[12px] text-ink-soft">{a.size}</span>
              <span className="w-24 text-right text-[12px] text-ink-soft">{a.addedOn}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 flex items-center gap-1.5 text-[12px] text-ink-soft">
        <Attach20Regular className="h-4 w-4" />
        File upload is wired to the document store in the next iteration.
      </p>
    </div>
  );

  const panels: Record<Tab, React.ReactNode> = {
    Definition: definition,
    Categorization: categorization,
    Scenarios: scenarios,
    Closure: closure,
    Attachments: attachments,
  };

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-white">
      {/* Issue header */}
      <header className="border-b border-line px-5 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-[18px] font-bold text-navy">{issue.title}</h1>
            <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-ink-soft">
              <span>Issue ({issue.issueNo})</span>
              <span className="text-line">//</span>
              <span className={issue.closed ? "font-semibold text-navy" : "font-semibold text-green"}>
                {issue.closed ? `Closed ${issue.closureDate ?? ""}` : "Open"}
              </span>
              <span className="text-line">//</span>
              <span>
                Last update by {issue.lastUpdateBy || "—"} on {issue.lastUpdate}
              </span>
              {isStale(issue) && (
                <Badge tone="amber">Not updated for {daysSince(issue.lastUpdate)} days</Badge>
              )}
              {issue.locked && <Badge tone="neutral">Locked</Badge>}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {editing ? (
              <>
                <button
                  onClick={() => {
                    setDraft(issue);
                    setEditing(false);
                    setStartingClosure(false);
                  }}
                  className="btn-ghost"
                >
                  <Dismiss20Regular className="h-4 w-4" />
                  Cancel
                </button>
                <button onClick={save} disabled={saving} className="btn-green">
                  <Save20Regular className="h-4 w-4" />
                  {saving ? "Saving…" : "Save"}
                </button>
              </>
            ) : (
              <>
                <button onClick={remove} className="btn-danger" disabled={issue.locked}>
                  <Delete20Regular className="h-4 w-4" />
                  Delete
                </button>
                <button onClick={() => setEditing(true)} className="btn-primary" disabled={issue.locked}>
                  <Edit20Regular className="h-4 w-4" />
                  Edit
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab bar with completion markers */}
        <nav className="-mb-3 mt-3 flex gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 rounded-t-[4px] border border-b-0 px-3.5 py-1.5 text-[12.5px] font-semibold transition ${
                tab === t
                  ? "border-line bg-navy text-white"
                  : "border-transparent text-ink-soft hover:bg-muted hover:text-navy"
              }`}
            >
              {t}
              <CompletionDot
                complete={completion[t]}
                title={completion[t] ? `${t} complete` : `${t} incomplete`}
              />
            </button>
          ))}
        </nav>
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-5 pb-20">{panels[tab]}</div>
    </section>
  );
}

export function DivisionChips({ divisions }: { divisions: DivisionCode[] }) {
  return <>{divisions.join(" ")}</>;
}
