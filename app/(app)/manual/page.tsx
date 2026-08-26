import Link from "next/link";
{/* This is Akes first comment*/}
const SECTIONS = [
  {
    title: "Finding an issue",
    body: [
      "The filter bar sits above every list: country, caretaker, division, age of the last update, open or closed status, and a free-text search across titles, people, countries and descriptions.",
      "The circular arrow on the left clears every filter at once. The counter on the right always tells you how many issues you are looking at out of the total.",
    ],
  },
  {
    title: "The four views",
    body: [
      "Dashboard: portfolio overview — open and closed counts, issues going stale, and the split by country, division and funnel stage.",
      "Back and Reload sit in the header on every screen: Back returns to the previous one, Reload fetches the issues again.",
      "Table View: one row per issue, every column sortable, and the row takes the colour of its actionability. Funnel Board: the same issues as cards you can drag from one funnel stage to another.",
    ],
  },
  {
    title: "Filling in an issue",
    body: [
      "Each tab carries a marker: a green check when the tab is complete, an amber warning when a key field is still missing.",
      "Definition, Categorization and Scenarios are filled in as the issue progresses. The Closure tab stays hidden until you start the closure, so you never face a page of empty fields.",
      "Close & Save Issue stays disabled until the description, the impact type, the driver and the closure date are filled in. The button tells you what is still missing.",
    ],
  },
  {
    title: "The assistant",
    body: [
      "On any list, the assistant button opens a chat. Ask a question in plain English and it answers from the portfolio, then narrows the list to the issues it used. Clear the selection with the amber bar.",
      "When you create an issue, describe it in your own words in the left pane. The assistant proposes a value for each field, highlighted in amber. Nothing is written until you accept it, field by field or all at once. It also flags issues that look like duplicates.",
    ],
  },
  {
    title: "Value at Stake",
    body: [
      "Every amount is a positive figure: the worst case holds how much sales is at risk, the best case how much is to be gained. Before closure, the value at stake is their sum, so it is never negative. Once the issue is closed, it is the value recorded at closure. All figures are in million EUR.",
    ],
  },
];

export default function ManualPage() {
  return (
    <main className="min-h-0 flex-1 overflow-auto bg-white p-6">
      <div className="mx-auto max-w-[820px]">
        <div className="flex items-center justify-center gap-6 border-b border-line pb-5">
          <img src="/character-extinguisher.png" alt="" width={90} height={104} />
          <div className="text-center">
            <h1 className="text-[20px] font-bold text-navy">User manual</h1>
            <p className="mt-1 text-[13px] text-ink-soft">
              Public Affairs — Value Capture System.
            </p>
          </div>
          <img src="/character-extinguisher.png" alt="" width={90} height={104} className="-scale-x-100" />
        </div>

        <div className="mt-6 space-y-6">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="mb-1.5 text-[14px] font-bold text-navy">{s.title}</h2>
              {s.body.map((p, idx) => (
                <p key={idx} className="mb-2 text-[13px] leading-relaxed text-ink">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>

        <Link href="/" className="btn-ghost mt-8">
          Back to the dashboard
        </Link>
      </div>
    </main>
  );
}
