"use client";

import { useRouter } from "next/navigation";
import { ChevronUpDown16Regular, LockClosed16Regular } from "@fluentui/react-icons";
import { useStore } from "@/lib/store";
import { issueVas, isStale, type Issue } from "@/lib/types";
import { ActionabilityPill, Badge, Divisions, Toggle, Value, Vas } from "./ui";

const COLS: { key: string; label: string; sort?: string; align?: string; width: string }[] = [
  { key: "title", label: "Issue Title", sort: "title", width: "w-[18%]" },
  { key: "country", label: "Country", sort: "country", width: "w-[6%]" },
  { key: "caretakers", label: "Caretakers", width: "w-[13%]" },
  { key: "divisions", label: "Divisions", width: "w-[6%]" },
  { key: "area", label: "Business Area", width: "w-[11%]" },
  { key: "stage", label: "Funnel Stage", width: "w-[9%]" },
  { key: "action", label: "Actionability", width: "w-[8%]" },
  { key: "unique", label: "Uniqueness", width: "w-[9%]" },
  { key: "closed", label: "Closed", width: "w-[5%]" },
  { key: "vas", label: "Value at Stake", sort: "vas", align: "text-right", width: "w-[8%]" },
  { key: "update", label: "Last Update", sort: "update", align: "text-right", width: "w-[8%]" },
];

export default function TableView() {
  const router = useRouter();
  const { filtered, filters, setFilters, loading } = useStore();

  function toggleSort(base: string) {
    const asc = `${base}-asc` as typeof filters.sort;
    const desc = `${base}-desc` as typeof filters.sort;
    setFilters({ sort: filters.sort === asc ? desc : asc });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full table-fixed border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-navy-tint">
              {COLS.map((c) => (
                <th
                  key={c.key}
                  className={`${c.width} border-b border-line px-3 py-2 text-left align-bottom text-[12px] font-bold text-navy ${c.align ?? ""}`}
                >
                  {c.sort ? (
                    <button
                      onClick={() => toggleSort(c.sort!)}
                      className={`inline-flex items-center gap-1 hover:underline ${
                        c.align === "text-right" ? "flex-row-reverse" : ""
                      }`}
                    >
                      {c.label}
                      <ChevronUpDown16Regular className="h-3.5 w-3.5 opacity-60" />
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((i: Issue, idx) => (
              <tr
                key={i.id}
                onClick={() => router.push(`/issues/${i.id}`)}
                className={`cursor-pointer border-b border-line/70 transition hover:bg-navy-tint/60 ${
                  idx % 2 ? "bg-muted/45" : "bg-white"
                }`}
              >
                <td className="px-3 py-2.5 align-top">
                  <div className="flex items-start gap-1.5">
                    <span className="font-semibold text-navy">{i.title}</span>
                    {i.locked && (
                      <LockClosed16Regular
                        className="mt-[2px] h-3.5 w-3.5 shrink-0 text-ink-soft"
                        title="Locked — read only"
                      />
                    )}
                  </div>
                  {isStale(i) && (
                    <span className="mt-1 inline-block">
                      <Badge tone="amber">Not updated for 60+ days</Badge>
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 align-top font-semibold">{i.country}</td>
                <td className="px-3 py-2.5 align-top text-ink-soft">
                  {[i.lead, ...i.team].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="px-3 py-2.5 align-top">
                  <Divisions issue={i} />
                </td>
                <td className="px-3 py-2.5 align-top text-ink-soft">
                  <Value>{i.businessArea}</Value>
                </td>
                <td className="px-3 py-2.5 align-top text-ink-soft">
                  <Value>{i.funnelStage}</Value>
                </td>
                <td className="px-3 py-2.5 align-top">
                  <ActionabilityPill value={i.actionability} />
                </td>
                <td className="px-3 py-2.5 align-top text-ink-soft">
                  {i.uniqueness === "No Value Selected" ? (
                    <span className="italic text-ink-soft/70">No value selected</span>
                  ) : (
                    i.uniqueness
                  )}
                </td>
                <td className="px-3 py-2.5 align-top" onClick={(e) => e.stopPropagation()}>
                  <Toggle checked={i.closed} disabled />
                </td>
                <td className="px-3 py-2.5 text-right align-top">
                  <Vas value={issueVas(i)} />
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-right align-top tabular-nums text-ink-soft">
                  {i.lastUpdate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && filtered.length === 0 && (
          <p className="p-8 text-center text-[13px] text-ink-soft">
            No issue matches the current filters.
          </p>
        )}
      </div>

      <div className="border-t border-line bg-navy px-3 py-1.5 text-center text-[12px] font-semibold text-white">
        Rows: {filtered.length}
      </div>
    </div>
  );
}
