# How the repository is organised

Every file, what it is for, and how the application goes from source code to a
live site. Written to be readable without prior knowledge of the framework.

## Two kinds of file names

**Names imposed by the framework.** Next.js maps files to URLs by their path, so
some names are part of the contract and cannot be changed. `app/table/page.tsx`
*is* the page served at `/table`. `route.ts` *is* an API endpoint. `layout.tsx`
wraps everything below it. `middleware.ts` runs before every request. These names
are a convention every web developer reads instantly.

**Names we chose.** Everything in `lib/` and `components/`. Those are named for
what they hold.

---

## The tree

```
app/                       every screen and every endpoint
  layout.tsx               the HTML shell: the font, the page title
  globals.css              the palette and the shared component styles
  login/page.tsx           the password screen
  (app)/                   everything behind the password
    layout.tsx             the blue band, the navigation, the assistant button
    page.tsx               the dashboard
    table/page.tsx         the table view
    gallery/page.tsx       the gallery view
    board/page.tsx         the funnel board
    manual/page.tsx        the user manual
    issues/[id]/page.tsx   one issue: the left list plus the five tabs
  api/                     the server side, no interface
    login/route.ts         checks the password, issues the session cookie
    issues/route.ts        list all issues, create one
    issues/[id]/route.ts   update one issue, delete one
    ai/fill/route.ts       assistant 1: briefing to proposed fields
    ai/query/route.ts      assistant 2: question to answer and shortlist
    seed/route.ts          loads the twenty demo records, replayable
    health/route.ts        reports which storage is live

components/                the reusable pieces of interface
  AppHeader.tsx            the corporate band and the four view tabs
  FilterBar.tsx            country, caretaker, division, age, status, search, sort
  ListShell.tsx            the frame shared by the three list views
  TableView.tsx            the table, its columns and its sorting
  GalleryView.tsx          the cards, also used for the list on the issue page
  KanbanView.tsx           the funnel board and its drag and drop
  IssueDetail.tsx          the five tabs, view mode and edit mode
  NewIssueDialog.tsx       the creation form and the assistant panel beside it
  AssistantChat.tsx        the chat window on the list views
  SharedElements.tsx       small shared pieces: badges, avatars, toggles, amounts

lib/                       the logic, no interface
  issue-model.ts           THE file that matters. Fields of an issue, every
                           dropdown list, and the business rules: value at stake,
                           what makes a tab complete, what blocks a closure
  data-store.ts            reading and writing issues. Two interchangeable
                           implementations behind one interface: Postgres, and a
                           local file for development
  client-state.tsx         what the browser holds in memory: the loaded issues,
                           the active filters, the sorting
  ai-client.ts             the single point where a model is called
  auth.ts                  password check and signed session cookie
  demo-data.ts             the twenty placeholder records

middleware.ts              runs before every request: no valid session, no access
docs/                      this file and the technical briefing
```

## Configuration files

| File | Role |
| --- | --- |
| `package.json` | The list of libraries used and the commands (`dev`, `build`, `start`) |
| `package-lock.json` | The exact version of every library. Generated, never edited by hand |
| `tsconfig.json` | Compiler settings |
| `next.config.ts` | Framework settings |
| `postcss.config.mjs` | Plugs the styling tool into the build |
| `.gitignore` | What must never reach the repository: secrets, build output, local data |
| `.env.example` | The template of the four environment variables, with empty values |

**The real secrets are nowhere in this repository.** The password, the session
key and the model key live in the hosting settings, and are injected at runtime.

---

## From source code to a live site

**1. Write.** A change is made, either on a machine or directly in the GitHub web
editor.

**2. Commit and push.** The change is recorded with a message explaining why, and
sent to GitHub.

**3. The host picks it up.** Vercel is connected to the repository and reacts to
every push on `main` on its own. Nobody triggers anything.

**4. Build.** Three things happen in sequence, and each one can stop the release:
- TypeScript checks that the whole project still holds together. A field that
  does not exist, a value of the wrong kind, and it stops here.
- Next.js compiles the TypeScript into the JavaScript that browsers understand,
  and prepares every page.
- The styles are compiled, keeping only what the application actually uses.

**5. Live, or not at all.** A successful build replaces the live version in
seconds. **A failed build changes nothing: the previous version stays online.**
This is the safety net that makes editing from GitHub reasonable.

**6. Rollback.** Every past version stays available. Returning to a previous one
is one click in the hosting dashboard, and takes effect immediately.

A change pushed to a branch other than `main` gets its own address instead of
touching the live application. That is how a modification is reviewed before it
reaches users.

---

## Where to change what

The README carries the table mapping each kind of change to its file. In short:
wording and lists in `lib/issue-model.ts`, colours in `app/globals.css`, assistant
behaviour in the two files under `app/api/ai/`.
