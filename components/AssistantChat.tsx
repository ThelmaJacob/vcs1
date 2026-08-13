"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dismiss20Regular,
  Send20Filled,
  Sparkle20Filled,
} from "@fluentui/react-icons";
import { useStore } from "@/lib/client-state";

interface Turn {
  role: "user" | "assistant";
  text: string;
  count?: number;
  error?: boolean;
}

const SUGGESTIONS = [
  "Which open issues carry the highest value at stake?",
  "Anything not updated in the last two months?",
  "Show me the crisis management issues",
];

export default function AssistantChat() {
  const { setFilters, filters, resetFilters } = useStore();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  async function ask(question: string) {
    if (!question.trim() || busy) return;
    setTurns((t) => [...t, { role: "user", text: question }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "The assistant could not answer");

      if (json.issueIds?.length) {
        setFilters({ ...json.filters, ids: json.issueIds });
      } else if (json.filters && Object.keys(json.filters).length) {
        setFilters({ ...json.filters, ids: null });
      }
      setTurns((t) => [
        ...t,
        { role: "assistant", text: json.answer, count: json.issueIds?.length ?? 0 },
      ]);
    } catch (e) {
      setTurns((t) => [
        ...t,
        {
          role: "assistant",
          text: e instanceof Error ? e.message : "The assistant is unavailable",
          error: true,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-navy px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg transition hover:bg-navy-soft"
      >
        <Sparkle20Filled className="h-4 w-4" />
        Ask the assistant
      </button>
    );
  }

  return (
    <aside className="fixed bottom-5 right-5 z-40 flex h-[520px] w-[380px] flex-col overflow-hidden rounded-[6px] border border-line bg-white shadow-2xl">
      <header className="flex items-center justify-between bg-navy px-3 py-2.5 text-white">
        <span className="flex items-center gap-2 text-[13px] font-semibold">
          <Sparkle20Filled className="h-4 w-4" />
          VCS assistant
        </span>
        <button onClick={() => setOpen(false)} className="rounded p-1 hover:bg-white/10">
          <Dismiss20Regular className="h-4 w-4" />
        </button>
      </header>

      <div ref={scroller} className="flex-1 space-y-3 overflow-auto bg-muted/50 p-3">
        {turns.length === 0 && (
          <div className="space-y-2">
            <p className="text-[12.5px] text-ink-soft">
              Ask about the portfolio in plain English. The assistant answers and filters the
              list below to the issues it used.
            </p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="block w-full rounded-[4px] border border-line bg-white px-2.5 py-2 text-left text-[12px] text-navy transition hover:border-navy/40 hover:bg-navy-tint"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {turns.map((t, idx) => (
          <div
            key={idx}
            className={`max-w-[92%] rounded-[6px] px-3 py-2 text-[12.5px] leading-relaxed ${
              t.role === "user"
                ? "ml-auto bg-navy text-white"
                : t.error
                  ? "border border-red/30 bg-red-tint text-red"
                  : "border border-line bg-white text-ink"
            }`}
          >
            {t.text}
            {t.role === "assistant" && !t.error && (t.count ?? 0) > 0 && (
              <div className="mt-1.5 border-t border-line pt-1.5 text-[11px] font-semibold text-ink-soft">
                {t.count} issue{t.count === 1 ? "" : "s"} shown in the list
              </div>
            )}
          </div>
        ))}

        {busy && (
          <div className="w-fit rounded-[6px] border border-line bg-white px-3 py-2 text-[12.5px] text-ink-soft">
            Reading the portfolio…
          </div>
        )}
      </div>

      {filters.ids && (
        <button
          onClick={resetFilters}
          className="border-t border-line bg-amber-tint px-3 py-1.5 text-left text-[11.5px] font-semibold text-[#9a6410] hover:brightness-95"
        >
          The list is showing the assistant&apos;s selection — clear it
        </button>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(input);
        }}
        className="flex items-center gap-2 border-t border-line p-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          className="field flex-1"
        />
        <button type="submit" disabled={busy || !input.trim()} className="btn-primary px-2.5">
          <Send20Filled className="h-4 w-4" />
        </button>
      </form>
    </aside>
  );
}
