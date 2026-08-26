
"use client";
import { ArrowDownload20Regular } from "@fluentui/react-icons";
import { useStore } from "@/lib/client-state";
import { issueVas, type Issue } from "@/lib/issue-model";
/** The eleven columns of the table, in the same order, and what each one writes to the file. */
const COLUMNS: { header: string; value: (issue: Issue) => string }[] = [
{ header: "Issue Title", value: (i) => i.title },
{ header: "Country", value: (i) => i.country },
{ header: "Caretakers", value: (i) => [i.lead, ...i.team].filter(Boolean).join(", ") },
{ header: "Divisions", value: (i) => i.divisions.join(", ") },
{ header: "Business Area", value: (i) => i.businessArea },
{ header: "Funnel Stage", value: (i) => i.funnelStage },
{ header: "Actionability", value: (i) => i.actionability },
{ header: "Uniqueness", value: (i) => i.uniqueness },
{ header: "Closed", value: (i) => (i.closed ? "Yes" : "No") },
{
header: "Value at Stake",
value: (i) => {
const vas = issueVas(i);
return vas === null ? "" : String(vas);
},
},
{ header: "Last Update", value: (i) => i.lastUpdate },
];
/** Quotes every cell and doubles the quotes inside it, so a comma never splits a column. */
function csvCell(value: string): string {
return  "${value.replace(/"/g, '""')}" ;
}
export default function ExportCsvButton() {
const { filtered, loading } = useStore();
function exportCsv() {
const header = COLUMNS.map((c) => csvCell(c.header)).join(",");
const rows = filtered.map((issue) =>
COLUMNS.map((c) => csvCell(c.value(issue))).join(",")
);
/* The leading BOM is what makes Excel on Windows read the file as UTF-8. */
const csv = "\uFEFF" + [header, ...rows].join("\r\n");
const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
const url = URL.createObjectURL(blob);
const link = document.createElement("a");
link.href = url;
link.download =  vcs-issues-${new Date().toISOString().slice(0, 10)}.csv ;
link.click();
URL.revokeObjectURL(url);
}
return (
<button
type="button"
onClick={exportCsv}
disabled={loading || filtered.length === 0}
className="btn-ghost"
>
<ArrowDownload20Regular className="h-4 w-4" />
Export CSV
</button>
);
}
Commit.
 
