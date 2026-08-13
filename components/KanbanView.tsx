"use client";

import { useState } from "react";
import Link from "next/link";
import { LockClosed16Regular } from "@fluentui/react-icons";
import { useStore } from "@/lib/client-state";
import { FUNNEL_STAGES, issueVas, isStale, type FunnelStage, type Issue } from "@/lib/issue-model";
import { ActionabilityPill, Avatar, Badge, Divisions, Vas } from "./SharedElements";

const UNSTAGED = "Not categorised";

export default function KanbanView() {
  const { filtered, updateIssue } = useStore();
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const columns: { key: string; issues: Issue[] }[] = [
    ...FUNNEL_STAGES.map((s) => ({
      key: s as string,
      issues: filtered.filter((i) => i.funnelStage === s),
    })),
    { key: UNSTAGED, issues: filtered.filter((i) => !i.funnelStage) },
  ];

  async function drop(stage: string) {
    setOver(null);
    const id = dragging;
    setDragging(null);
    if (!id) return;
    const issue = filtered.find((i) => i.id === id);
    if (!issue || issue.locked) return;
    const funnelStage = (stage === UNSTAGED ? "" : stage) as FunnelStage | "";
    if (issue.funnelStage === funnelStage) return;
    await updateIssue(id, { funnelStage });
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto p-3 pb-4">
      <div className="flex h-full min-w-max gap-3">
        {columns.map((col) => {
          const total = col.issues.reduce((s, i) => s + (issueVas(i) ?? 0), 0);
          return (
            <section
              key={col.key}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(col.key);
              }}
              onDragLeave={() => setOver((o) => (o === col.key ? null : o))}
              onDrop={() => drop(col.key)}
              className={`flex w-[300px] shrink-0 flex-col rounded-[4px] border transition ${
                over === col.key ? "border-navy bg-navy-tint/60" : "border-line bg-muted/60"
              }`}
            >
              <header className="flex items-baseline justify-between gap-2 border-b border-line px-3 py-2">
                <h3 className="text-[12.5px] font-bold text-navy">{col.key}</h3>
                <span className="text-[11px] font-semibold text-ink-soft">
                  {col.issues.length}
                </span>
              </header>
              <div className="flex items-center justify-between border-b border-line bg-white/70 px-3 py-1.5 text-[11px]">
                <span className="text-ink-soft">Value at Stake</span>
                <Vas value={col.issues.length ? total : null} />
              </div>

              <div className="flex-1 space-y-2 overflow-auto p-2">
                {col.issues.map((i) => (
                  <Link
                    key={i.id}
                    href={`/issues/${i.id}`}
                    draggable={!i.locked}
                    onDragStart={() => setDragging(i.id)}
                    onDragEnd={() => setDragging(null)}
                    className={`block cursor-grab rounded-[4px] border border-line bg-white p-2.5 transition hover:border-navy/40 hover:shadow-sm ${
                      dragging === i.id ? "opacity-40" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Avatar name={i.lead || "?"} size={24} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start gap-1">
                          <span className="line-clamp-2 text-[12.5px] font-semibold text-navy">
                            {i.title}
                          </span>
                          {i.locked && (
                            <LockClosed16Regular className="mt-[2px] h-3 w-3 shrink-0 text-ink-soft" />
                          )}
                        </span>
                        <span className="mt-1 flex items-center gap-2 text-[11px] text-ink-soft">
                          <span className="font-semibold text-ink">{i.country}</span>
                          <Divisions issue={i} />
                        </span>
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <ActionabilityPill value={i.actionability} />
                      <span className="flex items-center gap-1.5">
                        {isStale(i) && <Badge tone="amber">Stale</Badge>}
                        <Vas value={issueVas(i)} />
                      </span>
                    </div>
                  </Link>
                ))}
                {col.issues.length === 0 && (
                  <p className="px-2 py-6 text-center text-[12px] italic text-ink-soft/70">
                    Drop an issue here
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
