"use client";

import { ArrowCounterclockwise20Regular, Search20Regular } from "@fluentui/react-icons";
import { useStore } from "@/lib/client-state";
import { DIVISIONS, countryName } from "@/lib/issue-model";

function Select({
  label,
  value,
  onChange,
  children,
  width = "w-[150px]",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <label className="flex shrink-0 items-center gap-1.5">
      <span className="label whitespace-nowrap">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`field ${width} cursor-pointer py-1`}
      >
        {children}
      </select>
    </label>
  );
}

export default function FilterBar() {
  const { filters, setFilters, resetFilters, caretakers, countries } = useStore();

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-white px-3 py-2">
      <button
        onClick={resetFilters}
        title="Reset all filters"
        className="rounded-[3px] p-1 text-ink-soft transition hover:bg-muted hover:text-navy"
      >
        <ArrowCounterclockwise20Regular className="h-4 w-4" />
      </button>

      <Select
        label="Country"
        value={filters.country}
        onChange={(v) => setFilters({ country: v })}
      >
        <option value="">Filter Country</option>
        {countries.map((c) => (
          <option key={c} value={c}>
            {c} — {countryName(c)}
          </option>
        ))}
      </Select>

      <Select
        label="Caretaker"
        value={filters.caretaker}
        onChange={(v) => setFilters({ caretaker: v })}
        width="w-[164px]"
      >
        <option value="">Filter Caretaker</option>
        {caretakers.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>

      <Select
        label="Division"
        value={filters.division}
        onChange={(v) => setFilters({ division: v })}
        width="w-[138px]"
      >
        <option value="">Filter Division</option>
        {DIVISIONS.map((d) => (
          <option key={d.code} value={d.code}>
            {d.code} — {d.label}
          </option>
        ))}
      </Select>

      <Select
        label="Last Update"
        value={filters.age}
        onChange={(v) => setFilters({ age: v as never })}
        width="w-[128px]"
      >
        <option value="">Filter Age</option>
        <option value="lt30">Under 30 days</option>
        <option value="30to60">30 to 60 days</option>
        <option value="gt60">Over 60 days</option>
      </Select>

      <Select
        label="Status"
        value={filters.status}
        onChange={(v) => setFilters({ status: v as never })}
        width="w-[124px]"
      >
        <option value="open">Show Open</option>
        <option value="closed">Show Closed</option>
        <option value="all">Show All</option>
      </Select>


      <Select
        label="Sort by"
        value={filters.sort}
        onChange={(v) => setFilters({ sort: v as never })}
        width="w-[156px]"
      >
        <option value="title-asc">Title (a→z)</option>
        <option value="title-desc">Title (z→a)</option>
        <option value="vas-desc">Value at Stake (high→low)</option>
        <option value="vas-asc">Value at Stake (low→high)</option>
        <option value="update-desc">Last Update (newest)</option>
        <option value="update-asc">Last Update (oldest)</option>
        <option value="country-asc">Country (a→z)</option>
      </Select>

      <label className="flex min-w-[280px] flex-1 items-center gap-1.5">
        <span className="label whitespace-nowrap">Key Words</span>
        <span className="relative flex-1">
          <Search20Regular className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={filters.keywords}
            onChange={(e) => setFilters({ keywords: e.target.value })}
            placeholder="Search title, people, country, division, text…"
            className="field w-full py-1 pr-8"
          />
        </span>
      </label>

    </div>
  );
}
