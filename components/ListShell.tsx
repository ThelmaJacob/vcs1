"use client";

import { useEffect, useState } from "react";
import { Add20Filled } from "@fluentui/react-icons";
import FilterBar from "./FilterBar";
import NewIssueDialog from "./NewIssueDialog";
import { useStore } from "@/lib/client-state";

export default function ListShell({
  title,
  leading,
  children,
}: {
  title: string;
  /* Optional control shown to the left of the title, e.g. the Back button. */
  leading?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { reload, loading, filtered, issues } = useStore();
  const [creating, setCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [temporary, setTemporary] = useState(false);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((h) => setTemporary(Boolean(h.temporary)))
      .catch(() => setTemporary(false));
  }, []);

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-2.5">
        <div className="flex items-center gap-3">
          {leading}
          <h1 className="text-[16px] font-bold text-navy">
            {title}
            <span className="ml-2 text-[12.5px] font-semibold text-ink-soft">
              Showing {filtered.length} of {issues.length} items
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCreating(true)} className="btn-primary">
            <Add20Filled className="h-4 w-4" />
            New Issue
          </button>
        </div>
      </div>

      <FilterBar />

      {temporary && (
        <p className="border-b border-amber/40 bg-amber-tint px-4 py-1.5 text-[12px] text-[#9a6410]">
          Demo storage: no database is connected, so anything saved here is temporary and is not
          shared between users.
        </p>
      )}

      {!loading && issues.length === 0 && (
        <div className="flex items-center justify-between gap-4 border-b border-amber/40 bg-amber-tint px-4 py-2.5">
          <p className="text-[12.5px] text-[#9a6410]">
            The register is empty. Load the two sample issues to try the application.
          </p>
          <button
            onClick={async () => {
              setSeeding(true);
              await fetch("/api/seed", { method: "POST" });
              await reload();
              setSeeding(false);
            }}
            disabled={seeding}
            className="btn-ghost"
          >
            {seeding ? "Loading…" : "Load sample data"}
          </button>
        </div>
      )}

      {children}

      {creating && <NewIssueDialog onClose={() => setCreating(false)} />}
    </main>
  );
}
