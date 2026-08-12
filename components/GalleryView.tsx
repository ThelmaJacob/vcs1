"use client";

import Link from "next/link";
import { ChevronRight16Regular, LockClosed16Regular } from "@fluentui/react-icons";
import { useStore } from "@/lib/store";
import { issueVas, isStale, tabCompletion, type Issue } from "@/lib/types";
import { ActionabilityPill, Avatar, Badge, CompletionDot, Divisions, Value, Vas } from "./ui";

export function IssueCard({
  issue,
  active,
  compact,
}: {
  issue: Issue;
  active?: boolean;
  compact?: boolean;
}) {
  const tabs = tabCompletion(issue);
  const complete = Object.values(tabs).filter(Boolean).length;
  const people = [issue.lead, ...issue.team].filter(Boolean);

  return (
    <Link
      href={`/issues/${issue.id}`}
      className={`group relative flex gap-3 border-b border-line px-3 py-3 transition ${
        active ? "bg-navy-tint" : "bg-white hover:bg-muted"
      }`}
    >
      <span className="relative self-start">
        <Avatar name={people[0] ?? "?"} size={compact ? 30 : 36} />
        <span className="absolute -bottom-[2px] -right-[2px] rounded-full bg-white">
          <CompletionDot
            complete={complete === 5}
            title={`${complete} of 5 tabs complete`}
          />
        </span>
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="truncate text-[14px] font-semibold text-navy">{issue.title}</span>
          <span className="flex shrink-0 items-center gap-1.5">
            {issue.locked && (
              <LockClosed16Regular className="h-3.5 w-3.5 text-ink-soft" title="Locked" />
            )}
            <ChevronRight16Regular className="h-4 w-4 text-ink-soft/60" />
          </span>
        </span>

        <span className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[12px]">
          <span className="text-ink-soft">Country:</span>
          <span className="font-semibold">{issue.country || "—"}</span>
          <span className="text-ink-soft">Division:</span>
          <span>
            <Divisions issue={issue} />
          </span>
          <span className="text-ink-soft">Caretaker:</span>
          <span className="truncate text-ink">{people.join(", ") || "—"}</span>
        </span>

        {!compact && (
          <span className="mt-2 flex flex-wrap items-center gap-2 text-[12px]">
            <ActionabilityPill value={issue.actionability} />
            <span className="text-ink-soft">·</span>
            <span className="text-ink-soft">
              <Value>{issue.funnelStage}</Value>
            </span>
            <span className="ml-auto flex items-center gap-2">
              {isStale(issue) && <Badge tone="amber">Stale</Badge>}
              {issue.closed && <Badge tone="navy">Closed</Badge>}
              <span className="text-ink-soft">VaS</span>
              <Vas value={issueVas(issue)} />
            </span>
          </span>
        )}
      </span>
    </Link>
  );
}

export default function GalleryView() {
  const { filtered, loading } = useStore();

  return (
    <div className="min-h-0 flex-1 overflow-auto p-3 pb-20">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        {filtered.map((issue) => (
          <div key={issue.id} className="card overflow-hidden">
            <IssueCard issue={issue} />
          </div>
        ))}
      </div>
      {!loading && filtered.length === 0 && (
        <p className="p-8 text-center text-[13px] text-ink-soft">
          No issue matches the current filters.
        </p>
      )}
    </div>
  );
}
