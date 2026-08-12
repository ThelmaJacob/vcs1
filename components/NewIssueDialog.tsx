"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Checkmark16Filled,
  Dismiss16Filled,
  Dismiss20Regular,
  Sparkle20Filled,
  Warning20Filled,
} from "@fluentui/react-icons";
import { parsePeople, useStore } from "@/lib/store";
import {
  ACTIONABILITIES,
  BUSINESS_AREAS,
  COUNTRIES,
  DIVISIONS,
  FINANCIAL_IMPACT_DRIVERS,
  FUNNEL_STAGES,
  IMPACT_LEVELS,
  UNIQUENESS,
  type DivisionCode,
} from "@/lib/types";

type Draft = Record<string, unknown>;

const BLANK: Draft = {
  title: "",
  country: "",
  lead: "",
  team: [] as string[],
  description: "",
  divisions: [] as DivisionCode[],
  leadDivision: null,
  businessArea: "",
  actionability: "",
  funnelStage: "",
  uniqueness: "No Value Selected",
  qualitativeImpact: "",
  financialImpactDriver: "",
  worstCaseRisk: "",
  worstCaseSalesValue: null,
  bestCaseOpportunity: "",
  bestCaseSalesValue: null,
};

interface Duplicate {
  id: string;
  title: string;
  country: string;
}

export default function NewIssueDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { createIssue } = useStore();

  const [draft, setDraft] = useState<Draft>({ ...BLANK });
  const [suggested, setSuggested] = useState<Draft>({});
  const [confidence, setConfidence] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<string[]>([]);
  const [duplicates, setDuplicates] = useState<Duplicate[]>([]);
  const [briefing, setBriefing] = useState("");
  const [thinking, setThinking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: unknown) => setDraft((d) => ({ ...d, [k]: v }));

  /** A suggested value is shown in place of the real one until it is accepted. */
  const shown = (k: string) => (k in suggested ? suggested[k] : draft[k]);
  const isSuggested = (k: string) => k in suggested;

  function accept(k: string) {
    setDraft((d) => ({ ...d, [k]: suggested[k] }));
    setSuggested((s) => {
      const next = { ...s };
      delete next[k];
      return next;
    });
  }

  function reject(k: string) {
    setSuggested((s) => {
      const next = { ...s };
      delete next[k];
      return next;
    });
  }

  function acceptAll() {
    setDraft((d) => ({ ...d, ...suggested }));
    setSuggested({});
  }

  async function askAssistant() {
    if (briefing.trim().length < 10) return;
    setThinking(true);
    setError("");
    try {
      const res = await fetch("/api/ai/fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefing,
          current: Object.fromEntries(
            Object.entries(draft).filter(([, v]) => v !== "" && v !== null && (!Array.isArray(v) || v.length))
          ),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "The assistant could not answer");

      const fields: Draft = { ...json.fields };
      // businessUnit is set on the detail screen, not here
      delete fields.businessUnit;
      // Never overwrite something the user typed
      for (const k of Object.keys(fields)) {
        const cur = draft[k];
        const filled = Array.isArray(cur) ? cur.length > 0 : cur !== "" && cur !== null;
        if (filled) delete fields[k];
      }
      setSuggested(fields);
      setConfidence(json.confidence ?? {});
      setNotes(json.notes ?? []);
      setDuplicates(json.duplicates ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The assistant is unavailable");
    } finally {
      setThinking(false);
    }
  }

  async function save() {
    const payload = { ...draft, ...suggested };
    if (!payload.title || !payload.country || !payload.lead || !payload.description) {
      setError("Issue Title, Country, Lead and Description are required.");
      return;
    }
    setSaving(true);
    const created = await createIssue(payload);
    setSaving(false);
    if (created) {
      onClose();
      router.push(`/issues/${created.id}`);
    } else {
      setError("The issue could not be saved.");
    }
  }

  /* ---------- field renderers ----------
     Plain functions, not components: a component declared inside the render body
     would remount on every keystroke and steal the focus from the input. */

  function wrap(name: string, label: string, children: React.ReactNode) {
    return (
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="label">{label}</span>
          {isSuggested(name) && (
            <span className="flex items-center gap-1">
              <span className="text-[10.5px] font-semibold uppercase tracking-wide text-[#9a6410]">
                Proposed{confidence[name] ? ` · ${confidence[name]}` : ""}
              </span>
              <button
                type="button"
                onClick={() => accept(name)}
                title="Accept"
                className="rounded border border-green/40 bg-green-tint p-[2px] text-green hover:brightness-95"
              >
                <Checkmark16Filled className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => reject(name)}
                title="Discard"
                className="rounded border border-line bg-white p-[2px] text-ink-soft hover:bg-muted"
              >
                <Dismiss16Filled className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
        </div>
        {children}
      </div>
    );
  }

  const textField = (name: string, label: string, rows?: number) =>
    wrap(
      name,
      label,
      rows ? (
        <textarea
          rows={rows}
          value={String(shown(name) ?? "")}
          onChange={(e) => (isSuggested(name) ? setSuggested((s) => ({ ...s, [name]: e.target.value })) : set(name, e.target.value))}
          className={`field resize-y ${isSuggested(name) ? "suggested" : ""}`}
        />
      ) : (
        <input
          value={String(shown(name) ?? "")}
          onChange={(e) => (isSuggested(name) ? setSuggested((s) => ({ ...s, [name]: e.target.value })) : set(name, e.target.value))}
          className={`field ${isSuggested(name) ? "suggested" : ""}`}
        />
      )
    );

  const choiceField = (
    name: string,
    label: string,
    options: readonly string[] | { value: string; label: string }[],
    placeholder = "Select…"
  ) =>
    wrap(
      name,
      label,
      <select
        value={String(shown(name) ?? "")}
        onChange={(e) => (isSuggested(name) ? setSuggested((s) => ({ ...s, [name]: e.target.value })) : set(name, e.target.value))}
        className={`field cursor-pointer ${isSuggested(name) ? "suggested" : ""}`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) =>
          typeof o === "string" ? (
            <option key={o} value={o}>
              {o}
            </option>
          ) : (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          )
        )}
      </select>
    );

  const numField = (name: string, label: string) =>
    wrap(
      name,
      label,
      <input
        type="number"
        step="0.01"
        min="0"
        value={shown(name) === null || shown(name) === undefined ? "" : String(shown(name))}
        onChange={(e) => {
          const v = e.target.value === "" ? null : Math.abs(Number(e.target.value));
          isSuggested(name) ? setSuggested((s) => ({ ...s, [name]: v })) : set(name, v);
        }}
        className={`field tabular-nums ${isSuggested(name) ? "suggested" : ""}`}
      />
    );

  const divisions = (shown("divisions") as DivisionCode[]) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-6">
      <div className="flex h-full max-h-[860px] w-full max-w-[1180px] overflow-hidden rounded-[6px] bg-white shadow-2xl">
        {/* Assistant pane */}
        <section className="flex w-[360px] shrink-0 flex-col border-r border-line bg-muted/60">
          <header className="flex items-center gap-2 border-b border-line bg-navy px-3 py-2.5 text-white">
            <Sparkle20Filled className="h-4 w-4" />
            <span className="text-[13px] font-semibold">Draft with the assistant</span>
          </header>

          <div className="flex-1 space-y-3 overflow-auto p-3">
            <p className="text-[12.5px] leading-relaxed text-ink-soft">
              Describe the issue the way you would to a colleague. The assistant proposes a
              value for each field, highlighted in amber. Nothing is written until you accept
              it.
            </p>
            <textarea
              rows={8}
              value={briefing}
              onChange={(e) => setBriefing(e.target.value)}
              placeholder="A new pricing regulation is being prepared in country X. It would affect our reimbursement of…"
              className="field resize-y"
            />
            <button
              onClick={askAssistant}
              disabled={thinking || briefing.trim().length < 10}
              className="btn-primary w-full justify-center"
            >
              <Sparkle20Filled className="h-4 w-4" />
              {thinking ? "Drafting…" : "Propose the fields"}
            </button>

            {Object.keys(suggested).length > 0 && (
              <button onClick={acceptAll} className="btn-green w-full justify-center">
                <Checkmark16Filled className="h-4 w-4" />
                Accept all {Object.keys(suggested).length} proposals
              </button>
            )}

            {duplicates.length > 0 && (
              <div className="rounded-[4px] border border-amber/40 bg-amber-tint p-2.5">
                <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold text-[#9a6410]">
                  <Warning20Filled className="h-4 w-4" />
                  Possible duplicates
                </p>
                <ul className="space-y-1 text-[12px] text-ink">
                  {duplicates.map((d) => (
                    <li key={d.id}>
                      {d.title} <span className="text-ink-soft">({d.country})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {notes.length > 0 && (
              <div className="rounded-[4px] border border-line bg-white p-2.5">
                <p className="mb-1.5 text-[12px] font-bold text-navy">Still missing</p>
                <ul className="list-disc space-y-1 pl-4 text-[12px] text-ink-soft">
                  {notes.map((n, idx) => (
                    <li key={idx}>{n}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Form pane */}
        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <h2 className="text-[15px] font-bold text-navy">New Issue</h2>
            <button onClick={onClose} className="rounded p-1 text-ink-soft hover:bg-muted">
              <Dismiss20Regular className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 space-y-5 overflow-auto p-4">
            <div className="grid grid-cols-2 gap-4">
              {textField("title", "Issue Title *")}
              {choiceField(
                "country",
                "Country *",
                COUNTRIES.map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` })),
                "Find items"
              )}
              {textField("lead", "Lead *")}
              <div>
                <span className="label mb-1 block">Team</span>
                <input
                  value={((shown("team") as string[]) ?? []).join(", ")}
                  onChange={(e) => set("team", parsePeople(e.target.value))}
                  placeholder="Separate names with commas"
                  className="field"
                />
              </div>
            </div>

            {textField("description", "Description *", 6)}

            <div className="grid grid-cols-2 gap-4">
              {wrap(
                "divisions",
                "Divisions",
                <div
                  className={`flex gap-2 ${
                    isSuggested("divisions") ? "suggested rounded-[3px] border p-1.5" : ""
                  }`}
                >
                  {DIVISIONS.map((d) => {
                    const on = divisions.includes(d.code);
                    return (
                      <button
                        key={d.code}
                        type="button"
                        onClick={() => {
                          const next = on
                            ? divisions.filter((x) => x !== d.code)
                            : [...divisions, d.code];
                          isSuggested("divisions")
                            ? setSuggested((s) => ({ ...s, divisions: next }))
                            : set("divisions", next);
                        }}
                        className={`btn ${
                          on ? "border-navy bg-navy text-white" : "border-line bg-white text-ink-soft"
                        }`}
                        title={d.label}
                      >
                        {d.code}
                      </button>
                    );
                  })}
                </div>
              )}
              {choiceField(
                "leadDivision",
                "Lead Division",
                DIVISIONS.map((d) => ({ value: d.code, label: `${d.code} — ${d.label}` }))
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              {choiceField("businessArea", "Business Area", BUSINESS_AREAS)}
              {choiceField("funnelStage", "Funnel Stage", FUNNEL_STAGES)}
              {choiceField("actionability", "Actionability", ACTIONABILITIES)}
              {choiceField("uniqueness", "Uniqueness", UNIQUENESS)}
              {choiceField("qualitativeImpact", "Qualitative Impact", IMPACT_LEVELS)}
              {choiceField("financialImpactDriver", "Financial Impact Driver", FINANCIAL_IMPACT_DRIVERS)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {textField("worstCaseRisk", "Worst Case Risk", 4)}
              {textField("bestCaseOpportunity", "Best Case Opportunity", 4)}
              {numField("worstCaseSalesValue", "Worst Case Sales Value (million EUR)")}
              {numField("bestCaseSalesValue", "Best Case Sales Value (million EUR)")}
            </div>
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5">
            <span className="text-[12px] font-semibold text-red">{error}</span>
            <span className="flex gap-2">
              <button onClick={onClose} className="btn-ghost">
                Cancel
              </button>
              <button onClick={save} disabled={saving} className="btn-green">
                {saving ? "Saving…" : "Save Issue"}
              </button>
            </span>
          </footer>
        </section>
      </div>
    </div>
  );
}
