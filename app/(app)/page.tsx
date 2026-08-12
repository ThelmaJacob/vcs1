"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Add20Filled,
  CheckmarkCircle20Filled,
  ClockDismiss20Filled,
  Money20Filled,
  Signature20Regular,
} from "@fluentui/react-icons";
import { useStore } from "@/lib/store";
import {
  DIVISIONS,
  FUNNEL_STAGES,
  countryName,
  isStale,
  issueVas,
  type Issue,
} from "@/lib/types";
import NewIssueDialog from "@/components/NewIssueDialog";
import { ActionabilityPill, Badge, Vas } from "@/components/ui";

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  tone = "navy",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "navy" | "green" | "amber";
}) {
  const tones = {
    navy: "text-navy bg-navy-tint",
    green: "text-green bg-green-tint",
    amber: "text-[#9a6410] bg-amber-tint",
  };
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className={`flex h-10 w-10 items-center justify-center rounded-[4px] ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-[11.5px] font-semibold uppercase tracking-wide text-ink-soft">
          {label}
        </span>
        <span className="block text-[22px] font-bold leading-tight text-navy tabular-nums">
          {value}
        </span>
        {hint && <span className="block text-[11.5px] text-ink-soft">{hint}</span>}
      </span>
    </div>
  );
}

function BarList({
  title,
  rows,
}: {
  title: string;
  rows: { key: string; label: string; count: number; vas: number }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <section className="card p-4">
      <h2 className="mb-3 text-[13px] font-bold text-navy">{title}</h2>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.key} className="grid grid-cols-[130px_1fr_auto] items-center gap-3">
            <span className="truncate text-[12px] text-ink-soft" title={r.label}>
              {r.label}
            </span>
            <span className="h-[18px] rounded-[2px] bg-muted">
              <span
                className="block h-full rounded-[2px] bg-navy/85"
                style={{ width: `${(r.count / max) * 100}%` }}
              />
            </span>
            <span className="flex items-baseline gap-3 whitespace-nowrap text-[12px]">
              <span className="w-8 text-right font-semibold tabular-nums">{r.count}</span>
              <span className="w-20 text-right">
                <Vas value={r.vas} />
              </span>
            </span>
          </div>
        ))}
        {rows.length === 0 && <p className="text-[12px] italic text-ink-soft">No data yet.</p>}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const { issues, loading } = useStore();
  const [creating, setCreating] = useState(false);

  const stats = useMemo(() => {
    const open = issues.filter((i) => !i.closed);
    const closed = issues.filter((i) => i.closed);
    const stale = open.filter(isStale);
    const sum = (list: Issue[]) => list.reduce((s, i) => s + (issueVas(i) ?? 0), 0);

    const group = (key: (i: Issue) => string[], labels?: Record<string, string>) => {
      const map = new Map<string, { count: number; vas: number }>();
      for (const i of issues) {
        for (const k of key(i)) {
          const cur = map.get(k) ?? { count: 0, vas: 0 };
          map.set(k, { count: cur.count + 1, vas: cur.vas + (issueVas(i) ?? 0) });
        }
      }
      return [...map.entries()]
        .map(([k, v]) => ({ key: k, label: labels?.[k] ?? k, ...v }))
        .sort((a, b) => b.count - a.count);
    };

    const countries = new Set(issues.map((i) => i.country).filter(Boolean));

    return {
      open,
      closed,
      stale,
      countryCount: countries.size,
      openVas: sum(open),
      capturedVas: sum(closed),
      byCountry: group((i) => (i.country ? [i.country] : []), Object.fromEntries(issues.map((i) => [i.country, `${i.country} — ${countryName(i.country)}`]))).slice(0, 8),
      byDivision: group(
        (i) => i.divisions,
        Object.fromEntries(DIVISIONS.map((d) => [d.code, `${d.code} — ${d.label}`]))
      ),
      byStage: FUNNEL_STAGES.map((s) => {
        const list = issues.filter((i) => i.funnelStage === s);
        return { key: s, label: s, count: list.length, vas: sum(list) };
      }),
      top: [...issues]
        .filter((i) => issueVas(i) !== null)
        .sort((a, b) => (issueVas(b) ?? 0) - (issueVas(a) ?? 0))
        .slice(0, 5),
    };
  }, [issues]);

  return (
    <main className="min-h-0 flex-1 overflow-auto p-4 pb-20">
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="text-[16px] font-bold text-navy">
          Portfolio overview
          <span className="ml-2 text-[12.5px] font-semibold text-ink-soft">
            {issues.length} issues on record
          </span>
        </h1>
        <span className="flex items-center gap-3">
          {loading && <span className="text-[12px] text-ink-soft">Loading…</span>}
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Add20Filled className="h-4 w-4" />
            New Issue
          </button>
        </span>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-4">
        <Kpi
          label="Open issues"
          value={String(stats.open.length)}
          hint={`${stats.closed.length} closed`}
          icon={Signature20Regular}
        />
        <Kpi
          label="Value at stake, open"
          value={`${stats.openVas.toLocaleString("en-GB", { maximumFractionDigits: 1 })} M€`}
          hint="Best case minus worst case"
          icon={Money20Filled}
          tone="green"
        />
        <Kpi
          label="Value captured, closed"
          value={`${stats.capturedVas.toLocaleString("en-GB", { maximumFractionDigits: 1 })} M€`}
          hint="Recorded at closure"
          icon={CheckmarkCircle20Filled}
          tone="green"
        />
        <Kpi
          label="Not updated 60+ days"
          value={String(stats.stale.length)}
          hint="Open issues going stale"
          icon={ClockDismiss20Filled}
          tone="amber"
        />
      </div>

      <div className="mb-4 grid grid-cols-3 gap-4">
        <BarList
          title={stats.countryCount > 8 ? `By country (top 8 of ${stats.countryCount})` : "By country"}
          rows={stats.byCountry}
        />
        <BarList title="By division" rows={stats.byDivision} />
        <BarList title="By funnel stage" rows={stats.byStage} />
      </div>

      <section className="card">
        <h2 className="border-b border-line px-4 py-3 text-[13px] font-bold text-navy">
          Top issues by value at stake
        </h2>
        <table className="w-full">
          <tbody>
            {stats.top.map((i) => (
              <tr key={i.id} className="border-b border-line/70 last:border-0 hover:bg-muted/60">
                <td className="px-4 py-2.5">
                  <Link href={`/issues/${i.id}`} className="font-semibold text-navy hover:underline">
                    {i.title}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-[12px] text-ink-soft">{i.country}</td>
                <td className="px-3 py-2.5 text-[12px]">
                  <ActionabilityPill value={i.actionability} />
                </td>
                <td className="px-3 py-2.5">
                  {i.closed ? <Badge tone="navy">Closed</Badge> : isStale(i) ? <Badge tone="amber">Stale</Badge> : <Badge tone="green">Open</Badge>}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Vas value={issueVas(i)} size="lg" />
                </td>
              </tr>
            ))}
            {stats.top.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-[12.5px] italic text-ink-soft">
                  No issue carries a value at stake yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {creating && <NewIssueDialog onClose={() => setCreating(false)} />}
    </main>
  );
}
