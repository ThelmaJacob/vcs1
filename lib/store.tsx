"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { type Issue, daysSince, issueVas, isStale } from "./types";

export interface Filters {
  country: string;
  caretaker: string;
  division: string;
  age: "" | "lt30" | "30to60" | "gt60";
  status: "open" | "closed" | "all";
  keywords: string;
  /** Explicit shortlist set by the assistant. null = no shortlist. */
  ids: string[] | null;
  sort:
    | "title-asc"
    | "title-desc"
    | "vas-desc"
    | "vas-asc"
    | "update-desc"
    | "update-asc"
    | "country-asc";
}

export const EMPTY_FILTERS: Filters = {
  country: "",
  caretaker: "",
  division: "",
  age: "",
  status: "open",
  keywords: "",
  ids: null,
  sort: "title-asc",
};

interface Store {
  issues: Issue[];
  filtered: Issue[];
  loading: boolean;
  error: string;
  filters: Filters;
  setFilters: (f: Partial<Filters>) => void;
  resetFilters: () => void;
  caretakers: string[];
  countries: string[];
  reload: () => Promise<void>;
  createIssue: (patch: Partial<Issue>) => Promise<Issue | null>;
  updateIssue: (id: string, patch: Partial<Issue>) => Promise<Issue | null>;
  deleteIssue: (id: string) => Promise<boolean>;
}

const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

/** Comma-separated names → clean, de-duplicated list. */
export function parsePeople(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
}

export function everyone(i: Issue): string[] {
  return [i.lead, ...i.team].filter(Boolean);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFiltersState] = useState<Filters>(EMPTY_FILTERS);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/issues");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load issues");
      setIssues(json.issues);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load issues");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setFilters = useCallback((f: Partial<Filters>) => {
    setFiltersState((prev) => ({ ...prev, ...f }));
  }, []);

  const resetFilters = useCallback(() => setFiltersState(EMPTY_FILTERS), []);

  const createIssue = useCallback(async (patch: Partial<Issue>) => {
    const res = await fetch("/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Could not create the issue");
      return null;
    }
    setIssues((prev) => [...prev, json.issue]);
    // a shortlist from the assistant would hide the issue that was just created
    setFiltersState((f) => (f.ids ? { ...f, ids: null } : f));
    return json.issue as Issue;
  }, []);

  const updateIssue = useCallback(async (id: string, patch: Partial<Issue>) => {
    const res = await fetch(`/api/issues/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Could not save the issue");
      return null;
    }
    setIssues((prev) => prev.map((i) => (i.id === id ? json.issue : i)));
    return json.issue as Issue;
  }, []);

  const deleteIssue = useCallback(async (id: string) => {
    const res = await fetch(`/api/issues/${id}`, { method: "DELETE" });
    if (!res.ok) return false;
    setIssues((prev) => prev.filter((i) => i.id !== id));
    return true;
  }, []);

  const caretakers = useMemo(
    () => Array.from(new Set(issues.flatMap(everyone))).sort(),
    [issues]
  );
  const countries = useMemo(
    () => Array.from(new Set(issues.map((i) => i.country).filter(Boolean))).sort(),
    [issues]
  );

  const filtered = useMemo(() => {
    const kw = filters.keywords.trim().toLowerCase();
    const shortlist = filters.ids ? new Set(filters.ids) : null;
    const list = issues.filter((i) => {
      if (shortlist) return shortlist.has(i.id);
      if (filters.status === "open" && i.closed) return false;
      if (filters.status === "closed" && !i.closed) return false;
      if (filters.country && i.country !== filters.country) return false;
      if (filters.caretaker && !everyone(i).includes(filters.caretaker)) return false;
      if (filters.division && !i.divisions.includes(filters.division as never)) return false;
      if (filters.age) {
        const d = daysSince(i.lastUpdate);
        if (filters.age === "lt30" && d >= 30) return false;
        if (filters.age === "30to60" && (d < 30 || d > 60)) return false;
        if (filters.age === "gt60" && d <= 60) return false;
      }
      if (kw) {
        const hay = [
          i.title,
          i.country,
          i.description,
          i.businessArea,
          i.funnelStage,
          i.actionability,
          i.uniqueness,
          i.worstCaseRisk,
          i.bestCaseOpportunity,
          i.closureDescription,
          ...everyone(i),
          ...i.divisions,
        ]
          .join(" ")
          .toLowerCase();
        if (!kw.split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      return true;
    });

    // A shortlist keeps the order the assistant ranked it in.
    if (filters.ids) {
      const rank = new Map(filters.ids.map((id, idx) => [id, idx]));
      return [...list].sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
    }

    const vas = (i: Issue) => issueVas(i) ?? 0;
    const sorters: Record<Filters["sort"], (a: Issue, b: Issue) => number> = {
      "title-asc": (a, b) => a.title.localeCompare(b.title),
      "title-desc": (a, b) => b.title.localeCompare(a.title),
      "vas-desc": (a, b) => vas(b) - vas(a),
      "vas-asc": (a, b) => vas(a) - vas(b),
      "update-desc": (a, b) => b.lastUpdate.localeCompare(a.lastUpdate),
      "update-asc": (a, b) => a.lastUpdate.localeCompare(b.lastUpdate),
      "country-asc": (a, b) => a.country.localeCompare(b.country) || a.title.localeCompare(b.title),
    };
    return [...list].sort(sorters[filters.sort]);
  }, [issues, filters]);

  const value: Store = {
    issues,
    filtered,
    loading,
    error,
    filters,
    setFilters,
    resetFilters,
    caretakers,
    countries,
    reload,
    createIssue,
    updateIssue,
    deleteIssue,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export { isStale };
