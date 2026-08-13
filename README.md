# VCS — Public Affairs Value Capture System (web)

Web rewrite of the Bayer Power Apps canvas app (Public Affairs, for Thelma).
Next.js 15 + React 19 + Tailwind 4, hosted on Vercel.

Everything visible in the app is placeholder data. No real issue, person or figure
from the source application is stored in this repository.

## Running it locally

```bash
npm install
npm run dev        # http://localhost:3040
```

`.env.local` (copy from `.env.example`):

| Variable            | What it does                                                             |
| ------------------- | ------------------------------------------------------------------------ |
| `APP_PASSWORD`      | The shared password on the login screen                                   |
| `AUTH_SECRET`       | Signs the session cookie — `openssl rand -hex 32`                         |
| `ANTHROPIC_API_KEY` | Powers the assistant (field drafting, portfolio questions)                |
| `DATABASE_URL`      | Postgres connection string. Empty ⇒ temporary JSON file, local work only |

## Loading the two sample issues

Nothing to do by hand: open any list view and use **Load sample data**, or call the
endpoint. It creates the table if needed and writes only when the register is empty,
so it can be replayed safely.

```bash
curl -X POST https://<host>/api/seed -H "Cookie: vcs_session=<your session>"
```

`GET /api/health` reports which storage backend is live and whether the assistant
has a key.

## Storage

`lib/db.ts` has two interchangeable backends behind one interface:

- **Postgres** as soon as `DATABASE_URL` is set — table `vcs_issues`, created
  automatically on the first `/api/seed` call. The `vcs_` prefix keeps it clear of
  the other projects sharing the database.
- **JSON file** otherwise. Local development only: on Vercel it falls back to `/tmp`,
  which is wiped between instances. The app shows an amber banner whenever it is
  running in this mode.

## The assistant

Two server routes, both calling Claude with a forced tool schema so the answer is
always structured:

- `POST /api/ai/fill` — a free-text briefing becomes a proposed value per field,
  with a confidence level, a list of what is still missing, and possible duplicates
  among existing issues. Proposals show in amber and are accepted field by field;
  nothing is written until the user accepts.
- `POST /api/ai/query` — a plain-English question about the portfolio. Returns the
  answer plus the ids of the issues it used, which the list views then show.

Sign conventions matter in the prompt: a downside is a negative
`worstCaseSalesValue`, because Value at Stake is `bestCase − worstCase`.

## Changing things without a developer

Everything below can be edited straight from the GitHub web editor: open the file,
click the pencil, commit. If the project is connected to Vercel, the site rebuilds
and goes live on its own in about a minute. A typo cannot break the site silently:
a build that fails leaves the previous version online.

| What you want to change | File |
| --- | --- |
| Wording of any label, button or tab | the file for that screen, in `components/` |
| The dropdown lists (business areas, funnel stages, actionability, uniqueness, impact levels, financial impact drivers, countries) | `lib/types.ts`, at the top |
| The definitions shown next to the financial impact drivers | `lib/types.ts`, `FINANCIAL_IMPACT_DRIVER_HELP` |
| Colours of the palette | `app/globals.css`, the `@theme` block |
| How many days before an issue is flagged as stale | `lib/types.ts`, `STALE_AFTER_DAYS` |
| What makes a tab count as complete | `lib/types.ts`, `tabCompletion` |
| What blocks the Close & Save button | `lib/types.ts`, `closureBlockers` |
| How the value at stake is computed | `lib/types.ts`, `scenarioVas` and `issueVas` |
| What the assistant is told when it drafts an issue | `app/api/ai/fill/route.ts`, the `SYSTEM` text |
| What the assistant is told when it answers questions | `app/api/ai/query/route.ts`, the `SYSTEM` text |
| The demo records | `lib/seed.ts` |
| The user manual page | `app/(app)/manual/page.tsx` |

The two `SYSTEM` blocks are plain English instructions. Rewriting a sentence there
changes how the assistant behaves, no code involved.

Anything structural (a new field on an issue, a new screen, a new column) touches
several files at once and is a developer job.

## Deploying

```bash
vercel deploy --prod
```

Environment variables live in the Vercel project settings. `DATABASE_URL` is the one
that turns the demo into a real shared register.
