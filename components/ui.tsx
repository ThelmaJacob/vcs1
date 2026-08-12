"use client";

import { CheckmarkCircle12Filled, Warning12Filled } from "@fluentui/react-icons";
import type { Actionability, DivisionCode, Issue } from "@/lib/types";

/* ---------- Actionability traffic light ---------- */

const ACTION_TONE: Record<string, string> = {
  Possible: "bg-green",
  Likely: "bg-amber",
  "Very Likely": "bg-red",
};

export function ActionabilityPill({ value }: { value: Actionability | "" }) {
  if (!value) return <span className="text-ink-soft/70 italic">To be completed</span>;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className={`h-2 w-2 shrink-0 rounded-full ${ACTION_TONE[value] ?? "bg-ink-soft"}`} />
      {value}
    </span>
  );
}

/* ---------- Value at Stake ---------- */

export function Vas({
  value,
  size = "sm",
}: {
  value: number | null;
  size?: "sm" | "lg" | "xl";
}) {
  if (value === null) return <span className="text-ink-soft/70 italic">—</span>;
  const tone = value > 0 ? "text-green" : value < 0 ? "text-red" : "text-ink-soft";
  const sizes = { sm: "text-[13px]", lg: "text-[18px]", xl: "text-[26px]" };
  return (
    <span className={`font-bold tabular-nums ${tone} ${sizes[size]}`}>
      {value > 0 ? "+" : ""}
      {value.toLocaleString("en-GB", { maximumFractionDigits: 2 })}
    </span>
  );
}

export function Money({ value }: { value: number | null }) {
  if (value === null) return <span className="text-ink-soft/70 italic">To be completed</span>;
  return (
    <span className="font-semibold tabular-nums">
      {value.toLocaleString("en-GB", { maximumFractionDigits: 2 })}
    </span>
  );
}

/* ---------- Placeholder for empty values ---------- */

export function Value({ children }: { children?: React.ReactNode }) {
  const empty =
    children === null || children === undefined || children === "" || children === "None";
  if (empty) return <span className="italic text-ink-soft/70">To be completed</span>;
  return <>{children}</>;
}

/* ---------- People ---------- */

const AVATAR_TONES = [
  "bg-navy",
  "bg-navy-soft",
  "bg-[#3f7a94]",
  "bg-[#2f6b5f]",
  "bg-[#6b5f8a]",
];

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  let hash = 0;
  for (const c of name) hash = (hash + c.charCodeAt(0)) % 997;
  const tone = AVATAR_TONES[hash % AVATAR_TONES.length];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${tone}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      title={name}
    >
      {initials || "?"}
    </span>
  );
}

/* ---------- Completion marker, used on tabs and gallery cards ---------- */

export function CompletionDot({ complete, title }: { complete: boolean; title?: string }) {
  return complete ? (
    <CheckmarkCircle12Filled className="h-3.5 w-3.5 text-green" title={title ?? "Complete"} />
  ) : (
    <Warning12Filled className="h-3.5 w-3.5 text-amber" title={title ?? "Incomplete"} />
  );
}

/* ---------- Divisions ---------- */

export function Divisions({ issue }: { issue: Issue }) {
  if (!issue.divisions.length) return <span className="text-ink-soft/70 italic">—</span>;
  return (
    <span className="whitespace-nowrap font-semibold text-ink">
      {issue.divisions.map((d: DivisionCode) => (
        <span key={d} className="mr-1.5">
          {d}
          {issue.leadDivision === d && <span className="text-green">♦</span>}
        </span>
      ))}
    </span>
  );
}

/* ---------- Small building blocks ---------- */

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "green" | "amber" | "red" | "navy";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "bg-muted text-ink-soft border-line",
    green: "bg-green-tint text-green border-green/30",
    amber: "bg-amber-tint text-[#9a6410] border-amber/40",
    red: "bg-red-tint text-red border-red/30",
    navy: "bg-navy-tint text-navy border-navy/20",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-[1px] text-[11px] font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  disabled,
  labels = ["No", "Yes"],
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  labels?: [string, string];
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled || !onChange}
      onClick={() => onChange?.(!checked)}
      className="inline-flex items-center gap-2 disabled:opacity-60"
    >
      <span
        className={`relative h-[18px] w-[34px] rounded-full border transition ${
          checked ? "border-green bg-green" : "border-line bg-white"
        }`}
      >
        <span
          className={`absolute top-[2px] h-[12px] w-[12px] rounded-full transition-all ${
            checked ? "left-[18px] bg-white" : "left-[2px] bg-ink-soft"
          }`}
        />
      </span>
      <span className="text-[12px] font-semibold text-ink-soft">
        {checked ? labels[1] : labels[0]}
      </span>
    </button>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 border-b border-line pb-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-ink-soft">
      {children}
    </h3>
  );
}
