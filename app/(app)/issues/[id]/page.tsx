"use client";

import { use } from "react";
import Link from "next/link";
import FilterBar from "@/components/FilterBar";
import IssueDetail from "@/components/IssueDetail";
import { IssueCard } from "@/components/GalleryView";
import { useStore } from "@/lib/store";

export default function IssuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { issues, filtered, loading } = useStore();
  const issue = issues.find((i) => i.id === id);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <FilterBar />
      <div className="flex min-h-0 flex-1">
        {/* Left rail — the gallery, as in the original app */}
        <aside className="flex w-[360px] shrink-0 flex-col border-r border-line">
          <div className="min-h-0 flex-1 overflow-auto">
            {filtered.map((i) => (
              <IssueCard key={i.id} issue={i} active={i.id === id} compact />
            ))}
            {!loading && filtered.length === 0 && (
              <p className="p-6 text-center text-[12.5px] text-ink-soft">
                No issue matches the current filters.
              </p>
            )}
          </div>
          <div className="border-t border-line bg-navy px-3 py-1.5 text-center text-[12px] font-semibold text-white">
            Showing {filtered.length} of {issues.length} items
          </div>
        </aside>

        {issue ? (
          <IssueDetail issue={issue} />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-[13px] text-ink-soft">
              {loading ? (
                "Loading the issue…"
              ) : (
                <>
                  This issue no longer exists.{" "}
                  <Link href="/table" className="font-semibold text-navy underline">
                    Back to the table
                  </Link>
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
