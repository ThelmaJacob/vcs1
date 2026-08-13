# VCS web application — technical briefing

Prepared for the review of the rebuilt Value Capture System.
Answers the questions most likely to come up: what it is built with, how it is
changed, how it would run inside Bayer, how it would use the existing SharePoint
list, and what happens to the assistant behind Bayer's own AI licensing.

**One thing to state first.** Nothing in this application has ever touched Bayer
data. Every issue, name and figure visible in the demo is invented placeholder
text written for the purpose. The demo runs on an external host with a shared
password, which is appropriate for a demo and is not what a production
deployment would look like. The rest of this document describes what production
would look like.

---

## 1. What it is

A web application that reproduces the Power Apps canvas app and adds four things
the audit asked for: a portfolio dashboard, a sortable table that no longer
truncates its columns, a funnel board, and an assistant.

Five tabs per issue, identical in structure to the original: Definition,
Categorization, Scenarios, Closure, Attachments. Same fields, same option lists,
same closure workflow.

---

## 2. Languages and frameworks

| Layer | Technology | Why it matters here |
| --- | --- | --- |
| Language, front and back | **TypeScript** | One language across the whole application. A single developer can change the interface and the server logic without switching context. |
| User interface | **React 19** with **Next.js 15** | The industry default. Any web developer, internal or external, can pick this up. No proprietary runtime, no vendor lock-in. |
| Styling | **Tailwind CSS 4** | Styles live next to the markup. The corporate palette is declared once, in `app/globals.css`. |
| Server logic | **Next.js route handlers**, Node.js | Plain HTTP endpoints. Nothing exotic. |
| Data access | One interface, swappable implementations (`lib/db.ts`) | This is the point that matters for Bayer. See section 5. |
| Assistant | **TypeScript** calling a model API through one function (`lib/ai.ts`) | The model provider is a single seam, not a dependency spread across the code. See section 4. |

The whole application is about 4 500 lines. It has five runtime dependencies.
There is no proprietary platform underneath it, which is the main structural
difference with the Power Apps version: it can be hosted anywhere Node.js runs,
including entirely inside Bayer's own infrastructure.

---

## 3. How changes are made

Three levels, deliberately separated.

**Wording, lists, colours, thresholds, assistant instructions.** No developer.
These live in identified files and can be edited from the browser through the
GitHub web editor. The README carries a table mapping each kind of change to its
file. The dropdown lists (business areas, funnel stages, actionability,
uniqueness, impact levels, financial impact drivers, countries) are all in one
file, `lib/types.ts`. The stale threshold, the completion rules and the closure
validation rules are in that same file.

**A safety net comes with this.** If an edit breaks the application, the build
fails and the previous version stays online. It is not possible to take the site
down with a bad edit, and a rollback is one click.

**Structural changes.** A new field on an issue, a new screen, a new column: this
touches several files and is developer work. Sizing is small, typically hours,
not weeks.

**A list of changes.** The efficient path is one list, one batch, one deployment,
rather than change requests one at a time. Each batch produces a preview link
before anything reaches the live application.

---

## 4. The assistant, and Bayer's AI licensing

**What it does today.** Two functions. On issue creation, a free-text briefing is
turned into a proposed value for each field, shown in amber, accepted field by
field, with a confidence level, a list of what is still missing, and a check for
issues that look like duplicates. On the list views, a question in plain English
is answered from the portfolio and the list narrows to the issues used in the
answer.

**How it is built.** TypeScript. About 120 lines per function. The model is
called with a forced JSON schema, so the answer always has the expected shape.
The behaviour of each agent is not code: it is a block of English instructions at
the top of the file. Rewriting a sentence there changes what the assistant does.

**Which model.** Today, Claude (Anthropic), called over the internet with an API
key held by the demo host. **This is a demo arrangement and would not survive a
Bayer security review**, for the obvious reason: issue text would leave the
tenant.

**What Bayer's licensing does and does not give.** This distinction is worth
being precise about, because the three products share a name.

- **Microsoft 365 Copilot** is the assistant inside Word, Outlook and Teams. It
  is an end-user licence. It does not expose an API that a custom application can
  call. A full M365 Copilot rollout does not, by itself, let this application
  call a model.
- **Copilot Studio** is the tool for building custom agents. It does expose
  endpoints an application can call. A Copilot Studio agent for the VCS already
  exists from earlier work, and could be reused as the backend of this
  assistant.
- **Azure OpenAI Service** is the standard way to give a custom application a
  model inside a Microsoft tenant: data stays in the chosen region, is not used
  for training, and private networking is available. This is normally what
  security teams approve for an application like this one.

**What this means concretely.** The model call sits behind one function. Pointing
it at Azure OpenAI in Bayer's tenant, or at the existing Copilot Studio agent, is
a contained change of roughly one day, not a rewrite. The instructions, the
schemas and the whole interface are unchanged. **Which of the three is used is a
Bayer IT decision, and the application is deliberately built so that decision can
be made late and changed later.**

One caveat to raise rather than discover afterwards: the connectors and endpoints
an application is allowed to call are governed by the tenant's data policies.
That is the same governance question that blocked the earlier Copilot Studio work
between sandbox and production, and it should be validated with the Power
Platform and Azure administrators before committing to a date.

---

## 5. Using the existing SharePoint list

**This is the recommended path, and it removes the two hardest objections at
once**: no data migration, and no new place where Bayer data lives.

The application reads and writes through a single interface with interchangeable
implementations. Two exist today, a Postgres one and a local file one for
development. **A SharePoint implementation is a third one behind the same
interface.** Nothing above the data layer changes: not the screens, not the
filters, not the dashboard, not the assistant.

How it would work:

- Microsoft Graph, against the existing VCS list, using an Entra ID application
  registration with **Sites.Selected** permission. That permission grants access
  to one named site and nothing else, which is what a security review will want
  to see.
- The list stays the system of record. Retention, versioning, permissions and
  audit remain where Bayer already manages them.
- **The Power App can keep running on the same list during the transition.** Both
  front ends read and write the same items. That makes the switch reversible,
  which is usually the deciding argument.
- Volume is not a concern: the list holds around 570 items, far below the
  thresholds where SharePoint list performance becomes an issue.

The work is mapping the list columns to the fields of the application and
implementing the four operations the interface requires. Estimated at two to
three days once access to a test list is granted.

Alternatives, if SharePoint is judged unsuitable: Dataverse, or a managed
database inside Bayer's Azure subscription. Both are the same amount of work.
SharePoint is recommended because it changes the least.

---

## 6. Running it on Bayer infrastructure

The application is a standard Node.js server. It can be packaged as a container
image and deployed the way Bayer already deploys internal web applications.
Realistic targets, in decreasing order of likelihood:

1. **Azure App Service or Azure Container Apps** in Bayer's subscription, behind
   the corporate network and Entra ID. This is the usual answer.
2. **Bayer's internal Kubernetes**, from the same container image.
3. **Continue on the external host** for evaluation only, with placeholder data.

Two adaptations come with an internal deployment, both standard and both
contained:

- **Authentication.** The shared password of the demo is replaced by **Entra ID
  single sign-on**, so access follows the accounts and groups Bayer already
  manages. One to two days.
- **Configuration.** The password, the session secret, the model endpoint and the
  data connection are supplied as environment variables. They are not in the
  source code and never have been. The repository contains a template file with
  empty values.

---

## 7. Status, and what is needed to go further

**Ready today.** The five tabs, the four views, the filters, the closure
validation, the completion indicators, the stale flag, the two assistant
functions, twenty placeholder records, the deployment pipeline and the
documentation. The source code is in a private repository.

**Open, and each one is a Bayer decision, not a technical obstacle:**

| Question | Who decides |
| --- | --- |
| Where the data lives: existing SharePoint list, Dataverse, or a database | Bayer IT with Public Affairs |
| Which model backs the assistant: Azure OpenAI, Copilot Studio, or none for a first release | Bayer IT security |
| Where the application runs | Bayer IT |
| Whether the Power App keeps running in parallel during transition | Public Affairs |

**Rough sizing** for a first internal release, excluding Bayer's own approval
cycles, which are usually the longer part: SharePoint connection two to three
days, single sign-on one to two days, model switch one day, containerisation and
pipeline two to four days depending on internal process.

**Points to confirm with the business, listed here because they were reconstructed
from screenshots of the current application and should not be assumed:**

- the exact definition of Value at Stake, currently computed as the worst case
  plus the best case, both held as positive amounts
- the meaning of the padlock and of the green check on the gallery cards
- which fields make each tab count as complete
