# ADR 0001 — Expense log: architecture, scope, and personal data

**Status:** Accepted
**Date:** 2026-08-19
**Context:** `doc/requirement.md` · **Design:** `doc/superpowers/specs/2026-08-18-expense-log-design.md`

---

## Context

The brief asks for a frontend-only personal expense log: expenses with date, amount, and
category, a month view, totals per category, and a monthly limit that warns when passed. Mock
data, no backend, no login, single user.

It is also **deliberately incomplete**. Details are ours to decide, and the decision — plus
what we didn't pick — is what gets assessed. This ADR is that record.

---

## Decisions

### 1. React + TypeScript on Vite

**Rejected:** Blazor WebAssembly · ASP.NET Core MVC/Razor Pages · plain HTML/CSS/JS

The directory is named `expense-log-asp`, which points at ASP.NET. The brief says
frontend-only with no backend. Those pull in different directions, so the tie went to what
gets to a demonstrable, testable app fastest: Vite's dev server and Playwright integration are
both first-class, and the exercise is graded on workflow rather than on framework choice.

Blazor WASM was the closest alternative and would have resolved the naming tension elegantly —
it is ASP.NET Core tooling that publishes to static files, so genuinely no server. It lost on
toolchain weight and on Playwright being slower and more timing-sensitive against Blazor,
which matters when two E2E tests are a graded deliverable. ASP.NET MVC was rejected because it
requires a running server, the loosest fit to "no backend". Plain JS was rejected as
under-engineered for the state this app carries.

`vite build` emits a static `dist/` — no server-side rendering, nothing to run at request
time — which is what makes **GitHub Pages** a fit as the deploy target: it serves static files
and nothing else, so hosting costs the project nothing beyond what the static-export choice
already implied.

### 2. Persist to `localStorage`

**Rejected:** in-memory only · limit-only persistence

In-memory is the most literal reading of "mock data only", but the app forgets everything on
refresh, which makes for a poor demo and gives the E2E tests nothing durable to assert
against. `localStorage` keeps the zero-backend constraint intact while making the app behave
like an application.

It also gives the privacy question below something real to bite on. An app that stores nothing
has no interesting data story; this one does.

### 3. Per-month limits with carry-forward

**Rejected:** one global limit · per-category limits

A single global limit is the most literal reading of "you set a monthly limit" and the least
code. Per-month limits won because they make month navigation meaningful — with one global
number, moving between months shows the same limit forever.

The carry-forward rule resolves what an unset month should show: its own explicit limit, else
the nearest **earlier** month's, else none at all. The alternative — defaulting to zero — was
rejected because it means every newly-visited month opens already in breach.

Per-category limits were rejected as scope the brief never asked for.

### 4. Fixed category list

**Rejected:** user-defined categories · fixed list plus free-text

The brief needs totals per category. A fixed list of five delivers that with a `<select>` and
nothing else. User-defined categories require a management screen, rename semantics, and a
decision about what happens to expenses in a deleted category — real work, no assessed
benefit.

### 5. Money as integer minor units

**Rejected:** floating-point amounts

Floats accumulate visible artefacts across a totals column — `0.1 + 0.2` renders as
`0.30000000000000004`. A budget app displaying that in a demo is indefensible. Conversion
happens once, at the form boundary.

### 6. Dates as `YYYY-MM-DD` strings, month by string slice

**Rejected:** `Date` objects for grouping

`new Date('2026-08-01')` parses as UTC midnight, so any user west of UTC sees an expense
logged on the 1st fall into the previous month. String slicing (`date.slice(0, 7)`) is
timezone-proof and trivially testable.

### 7. Layered architecture: pure domain, storage adapter, thin React

**Rejected:** Zustand with `persist` middleware · hook-per-concern with no shared store

`src/domain/` imports nothing from React or the browser, so the budget rule — the only real
logic here — is tested by calling a function. Zustand would have put that logic inside a store,
testable only by instantiating it, and added a dependency React's own context makes
unnecessary at this size. Hook-per-concern left the over-limit calculation with nowhere to
live, since it needs both expenses and limits.

`src/storage/` is the only module touching `localStorage`. That boundary is what makes the
data section below verifiable rather than aspirational: there is exactly one place to look.

### 8. Scope: month navigation only

**Rejected:** editing an expense · deleting individual expenses · filtering by category

Cut to keep the assessed surface small. Editing reuses the add form with extra state for
little benefit; filtering duplicates what the category totals already show.

Per-row delete was cut too — but that left the app with no way to remove data, which the data
section below could not honestly accept. It was replaced with a single **Clear all data**
action: one affordance, complete erasure.

### 9. Clearing writes empty state; it does not delete the storage key

**Rejected:** deleting the key on clear

This one was wrong in the first draft of the design and caught in review of PR #31.

Seeding triggers when the storage key is **absent**. If clearing deleted the key, the next
page load would look exactly like a first run and cheerfully restore sixteen example expenses
and the €1,500 limit — the user's erasure silently undone. Clearing therefore writes
`{ version, expenses: [], limits: {} }` under the retained key. The key's presence marks a
returning user; its contents are what they chose to keep.

Recorded here because it is the decision most likely to be "simplified" by someone who reads
`clear()` and reaches for `removeItem`.

---

## Personal data and GDPR

### What the app touches

Expense date, amount, and category, plus a monthly spending limit. There is no name, email,
account, or device identifier — but the data is still **personal data** under GDPR Article
4(1): a set of dated amounts and categories describes an identifiable person's financial
behaviour, and combined with the device it sits on it is attributable to that person.

It is not a special category under Article 9. Financial data is sensitive in the ordinary
sense without being sensitive in the legal sense.

### Where it lives

In the user's own browser, in `localStorage`, written by exactly one module:
`src/storage/localStorage.ts`. No server, no database, no network requests, no analytics, no
cookies, no third-party processors, no telemetry. **No data leaves the device.**

### What that means

With no data held by us, most of the machinery doesn't engage. There is no controller holding
a copy, no processor to contract with, no international transfer, and no server-side breach
surface. The user is not a data subject in a relationship with a remote controller; they are a
person with a file on their own computer.

The rights still map onto something concrete:

| Right | How it's satisfied |
|---|---|
| **Erasure** (Art. 17) | "Clear all data" — and decision 9 above is what makes it stick rather than restoring on reload |
| **Access** (Art. 15) | The data is on the user's machine, readable in DevTools |
| **Portability** (Art. 20) | Same — though no export feature exists, which is an honest gap rather than a claim |
| **Rectification** (Art. 16) | Partially: expenses can't be edited (decision 8), only cleared wholesale |

The last two are deliberately not overclaimed. This app satisfies erasure properly and the
others only incidentally.

### What would change with a backend

The no-backend constraint is doing real work here, and it is worth being explicit about what
adding one would cost. Server persistence or user accounts would create a controller
relationship and with it:

- **A lawful basis** — contract for an account-based service, or consent, recorded and
  withdrawable
- **A privacy notice** at the point of collection, covering purpose, retention, and rights
- **A defined retention period**, with actual deletion when it expires — indefinite storage of
  financial history is not defensible
- **Working access, erasure, and portability endpoints**, not just a button that clears local
  state
- **Encryption in transit and at rest**, and access controls over the database
- **Breach notification** to the supervisory authority within 72 hours (Art. 33)
- **A processor agreement** (Art. 28) with the hosting provider, plus transfer safeguards if
  hosted outside the EEA
- **Data minimisation review** — an account means an email, which is more personal data than
  the app currently holds

This is the strongest argument for keeping the app frontend-only beyond the brief requiring
it: the compliance surface of a personal-finance backend is disproportionate to a single-user
expense log.

---

## Consequences

**Good.** The budget rule is unit-testable without a DOM. Personal data has exactly one write
path. Scope is small enough to finish and defend. Every rejected option is recorded, so
revisiting a decision starts from why rather than from scratch.

**Costs.** No data survives clearing the browser, changing browser, or switching device —
acceptable for a single-user exercise, unacceptable for a real product. No export. No
editing, so a mistyped expense can only be fixed by clearing everything. The layered structure
is more ceremony than an app this size strictly needs; it is justified by testability rather
than by size.

**Open.** If this ever grew a backend, decision 2 and the entire data section above would need
rewriting, not amending.
