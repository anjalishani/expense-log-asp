# Expense Log — Product Backlog

**Date:** 2026-08-18
**Derived from:** `doc/superpowers/specs/2026-08-18-expense-log-design.md`
**Source requirement:** `doc/requirement.md`

Epic order is build order — each epic depends on the ones above it. Priorities use MoSCoW.

Every epic and every story carries a traceability footer: the spec section (or requirement
clause) it derives from, and the GitHub issue that tracks it. Section marks like §5 refer to
the design spec above.

---

## Epic 1 — Project foundation

*Goal: a checked-out repo becomes a running, testable app in under five minutes.*

*Spec §3 · Issue #1*

### 1.1 Scaffold the application — **Must**

**As a** developer, **I want** a React + TypeScript app running on Vite, **so that** I have a
working dev server to build features against.

- **Given** a fresh clone, **when** I run `npm install && npm run dev`, **then** the app serves
  locally and renders without console errors
- `npm run build` produces a production bundle with no TypeScript errors
- Folder structure matches the spec's layout: `domain/`, `storage/`, `state/`, `components/`

*Spec §3, §4 · Issue #6*

### 1.2 Wire up unit testing — **Must**

**As a** developer, **I want** Vitest configured, **so that** domain logic can be tested
without a browser.

- `npm run test` runs the suite and reports pass/fail
- A single test file can be run in isolation
- Tests in `domain/` execute without any DOM environment

*Spec §3, §11 · Issue #7*

### 1.3 Wire up end-to-end testing — **Must**

**As a** developer, **I want** Playwright configured against the dev server, **so that** user
journeys can be verified in a real browser.

- `npx playwright test` starts the app and runs the suite
- A single test runs via `npx playwright test <file> -g "<title>"`
- Tests can seed `localStorage` through `addInitScript` before page load

*Spec §3, §11 · Issue #8*

### 1.4 Write the README — **Must**

**As a** newcomer, **I want** setup instructions that work first time, **so that** I can run
the app in under five minutes.

- Prerequisites state Node 20+
- Install, run, build, and both test commands are listed and verified accurate
- States what the app does and that data stays in the browser

*Requirement: "README that gets someone running the app in under 5 minutes" · Issue #9*

### 1.5 Configure Claude Code settings — **Must**

**As a** developer, **I want** a deliberate `.claude/settings.json`, **so that** project
permissions are intentional rather than default.

- Project `settings.json` is committed; `settings.local.json` stays gitignored
- Common safe commands are pre-allowed to reduce prompt friction
- The user/project/local hierarchy can be explained on demand

*Requirement: "Settings — settings.json set up on purpose" · Issue #10*

---

## Epic 2 — Expense capture and month view

*Goal: record expenses and see them a month at a time, broken down by category.*

*Spec §4, §5, §7 · Issue #2*

### 2.1 Domain foundations — **Must**

**As a** developer, **I want** pure types and money helpers, **so that** amounts are exact and
logic is testable in isolation.

- `Expense`, `Category`, `MonthKey`, `BudgetStatus` defined per spec
- Amounts held as integer minor units; parse and format round-trip correctly
- `money.ts` rejects unparseable input
- Nothing in `domain/` imports React, storage, or browser APIs

*Spec §4, §5 · Issue #11*

### 2.2 Add an expense — **Must**

**As a** user, **I want** to record an expense with a date, amount, and category, **so that**
my spending is captured.

- Form offers the five fixed categories: Groceries, Transport, Rent, Eating out, Other
- **Given** valid input, **when** I submit, **then** the expense appears in the list and the
  form clears
- Amount must be greater than zero; zero and negatives are rejected inline
- An invalid or missing date is rejected inline
- Submit is blocked while any field is invalid

*Spec §5, §7, §8 · Issue #12*

### 2.3 View a month's expenses — **Must**

**As a** user, **I want** to see the selected month's expenses newest first, **so that** I can
review recent spending.

- Only expenses whose `YYYY-MM` matches the selected month are listed
- Ordering is newest first, stable for equal dates
- An empty month shows an empty state, not a blank panel
- Month membership is derived by string slice, never `Date` parsing

*Spec §5, §7 · Issue #13*

### 2.4 Navigate between months — **Must**

**As a** user, **I want** to move to the previous or next month, **so that** I can review
spending over time.

- Previous and next controls change the selected month
- Navigation is unbounded in both directions
- The list, category totals, and budget summary all follow the selected month
- Crossing a year boundary works in both directions

*Spec §7 · Issue #14*

### 2.5 See totals per category — **Must**

**As a** user, **I want** per-category totals for the month, **so that** I can see where my
money went.

- One row per category with a non-zero total; zero rows are omitted
- Totals are computed at render from the expense list, never stored
- The sum of category totals equals the displayed month total

*Spec §7 · Issue #15*

---

## Epic 3 — Budget limit and warning

*Goal: the rule from the brief — set a limit, see what's left, get warned when it's passed.*

*Spec §5 (carry-forward), §7 · Issue #3*

### 3.1 Set a monthly limit — **Must**

**As a** user, **I want** to set a spending limit for a month, **so that** I have a budget to
track against.

- Entering a limit while viewing month M stores it against M only
- Earlier months are never rewritten
- The limit survives navigating away to another month and back
- Invalid input is rejected without clearing the existing limit

Durability across a page refresh is **not** part of this story — persistence arrives in 4.1,
which is deliberately later in the build order. This story is complete when the limit is
correct in application state.

*Spec §5 · Issue #16*

### 3.2 Resolve the limit for an unset month — **Must**

**As a** user, **I want** a month with no explicit limit to inherit my most recent one,
**so that** I don't have to re-enter it every month.

- An explicit limit for the month always wins
- Otherwise the limit comes from the nearest **earlier** month that has one
- Gaps are handled: a limit two or more months back still carries forward
- With no earlier limit anywhere, the month shows "no limit set" and never warns
- An unset month never defaults to zero

*Spec §5 (carry-forward rule) · Issue #17*

### 3.3 See remaining budget — **Must**

**As a** user, **I want** to see how much of my limit is left, **so that** I know where I
stand.

- Remaining equals the resolved limit minus the month's total spend
- It updates immediately when an expense is added
- It recalculates when the selected month changes
- When no limit is resolved, a "no limit set" message replaces the figure

*Spec §5, §7 · Issue #18*

### 3.4 Warn when the limit is passed — **Must**

**As a** user, **I want** a clear warning once I exceed my limit, **so that** I notice I've
overspent.

- **Given** spend below the limit, **then** no warning is shown
- **Given** spend exactly equal to the limit, **then** remaining reads zero and **no** warning
  is shown — passed means over, not reached
- **Given** spend one minor unit above the limit, **then** the warning appears
- The warning carries `role="alert"` and a stable `data-testid`

*Spec §7, §11 · Issue #19*

---

## Epic 4 — Persistence and privacy

*Goal: data survives a refresh, never crashes the app, and can be erased on demand.*

*Spec §6, §8, §10 · Issue #4*

### 4.1 Persist data locally — **Must**

**As a** user, **I want** my expenses and limits to survive a refresh, **so that** the app is
usable beyond one sitting.

- State saves to `localStorage` under a versioned key on every change
- State rehydrates on load
- Both expenses and monthly limits persist — this is where 3.1's durability is delivered
- `src/storage/localStorage.ts` is the only module touching `localStorage`

*Spec §6 · Issue #20*

### 4.2 Seed mock data on first run — **Should**

**As a** first-time user, **I want** the app to open with example data, **so that** I can see
what it does immediately.

- Seeding happens only when the storage key is **absent** — never merely because the stored
  state is empty
- Dates are generated relative to today, so the current month is always populated
- Ten expenses this month across all five categories, six last month
- An explicit €1,500.00 limit on the current month; seeded spend totals €1,180.00
- Consequently last month shows "no limit set" and next month inherits €1,500.00
- **Given** the user has cleared their data, **when** they reload, **then** nothing is
  re-seeded (see 4.5)

*Spec §6 · Issue #21*

### 4.3 Survive corrupt stored data — **Should**

**As a** user, **I want** the app to recover from unreadable saved data, **so that** it never
shows a blank screen.

- Version and shape are validated on load
- Invalid data falls back to seed data instead of throwing
- A dismissible notice explains that saved data could not be read

*Spec §8 · Issue #22*

### 4.5 Clear all data — **Must**

**As a** user, **I want** to erase everything I've recorded, **so that** I control my own data.

- The action requires confirmation before proceeding
- Clearing writes an **empty state** under the existing key — `{ version, expenses: [],
  limits: {} }` — rather than deleting the key
- The app resets to empty: no expenses, no limits
- **Given** cleared data, **when** the page is reloaded, **then** the app stays empty and does
  **not** re-seed
- This is the concrete right-to-erasure mechanism cited in the ADR

Retaining the key is what makes erasure stick. Deleting it would return the app to its
first-run state, and 4.2 would repopulate the very data the user asked to remove.

*Spec §6, §10 · Issue #24*

---

## Epic 5 — Quality and delivery

*Goal: the assessed artifacts — tests, PR workflow, decision record, session log.*

*Spec §11; requirement Thursday section · Issue #5*

### 5.1 Unit-test the domain and reducer — **Must**

**As a** developer, **I want** fast tests over the pure layers, **so that** the budget rule is
provably correct.

- Carry-forward covered: explicit, inherited, gap months, none at all
- The exactly-at-limit boundary is covered
- Month filtering covered across month and year boundaries
- Money parse/format round-trips
- Every reducer action covered, including `CLEAR_ALL`
- Clearing then rehydrating yields empty state, not seed data
- Schema validation covered for corrupt and wrong-version input

*Spec §11 · Issue #25*

### 5.2 End-to-end: add an expense — **Must**

**As a** reviewer, **I want** a test of the normal path, **so that** the core journey is
verified in a browser.

- Seeds `localStorage` via `addInitScript`, independent of seed data and today's date
- Adds an expense to the current month
- Asserts it appears in the list
- Asserts month total, its category total, and remaining budget each moved by exactly that
  amount

*Spec §11 · Issue #26*

### 5.3 End-to-end: the limit boundary — **Must**

**As a** reviewer, **I want** a test of the edge case, **so that** the warning's threshold is
pinned down.

- Starts from a seeded state just under the limit
- Adds the expense bringing spend to exactly the limit: remaining reads zero, no warning
- Adds one more minor unit: the warning appears
- The off-by-one intent is documented in the test title

*Spec §11 · Issue #27*

### 5.4 Ship a change through a reviewed PR — **Must**

**As a** team, **we want** every change to land via pull request, **so that** nothing reaches
`main` unreviewed.

- `main` is protected; direct pushes are rejected
- At least one PR is opened and reviewed by AI
- At least one review comment is acted on, with the follow-up commit visible in the PR
- Outside contributions are disabled on the public repo

*Requirement: Thursday demo, PR workflow · Issue #28*

### 5.5 Record the decisions — **Must**

**As a** reviewer, **I want** an ADR, **so that** I can see what was decided and what was
rejected.

- Kept in `doc/`, separate from the instructions in `CLAUDE.md`
- Records each decision *and* the alternatives not taken
- Covers what personal data the app touches and what GDPR would require
- Notes what would change if a backend were introduced

*Spec §9, §10 · Issue #29*

### 5.6 Export the session log — **Must**

**As a** reviewer, **I want** the working session exported, **so that** the process is
inspectable.

- Exported with the AI Hub script (AI-SDLC Documents > Session-Export)
- Committed into the repo
- Lands via a PR like everything else

*Requirement: Thursday demo, session log · Issue #30*

---

## Out of scope

Recorded so the board reflects deliberate omissions rather than oversights. Reasoning is in
spec §9.

| Not building | Why |
|---|---|
| Edit an expense | Reuses the add form with extra state for little assessed value |
| Delete a single expense | Erasure is covered by clear-all; per-row CRUD was cut as scope |
| Filter the list by category | Category totals already convey the breakdown |
| User-defined categories | Costs a management UI and rename/delete edge cases |
| Multi-currency | Single currency (EUR); no conversion concerns |
| Per-category limits | Never asked for by the requirement |
| Income or refunds | Amounts are strictly positive; this is a log, not a ledger |
| Any backend, database, or login | Excluded by the requirement, and the basis of the GDPR position |

### Cut for time (were in scope, deliberately dropped later)

The rest of this table was never planned. These two were — MoSCoW's own logic is to drop
`Could` before `Should` before `Must` when a deadline bites, which is what happened here on
2026-08-20 with epic 4 still ahead and the Thursday demo approaching.

| Not building | Why |
|---|---|
| 4.4 Work without storage (was **Could**) | Lowest-priority story in the backlog; private-browsing support isn't part of the brief. *Issue #23* |
