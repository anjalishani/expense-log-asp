# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Last updated:** 2026-08-20 — after month navigation (story #14), Playwright (PR #41,
story #8), per-category totals (story #15), setting a monthly limit (story #16), carry-forward
limit resolution (story #17), the remaining-budget display (story #18), the over-limit warning
(story #19, closing epic 3), the add-expense/budget-boundary Playwright suites (stories
#26–#27), unit-test coverage for the domain and reducer (story #25, epic 5), epic 4 —
persist to `localStorage` (#20), seed data (#21), corrupt-data recovery (#22), and clear all
data (#24) — (story 4.4 "work without storage" / #23 cut from scope under time pressure
rather than built; see `doc/backlog.md` and ADR 0001 decision 11), the GitHub Pages deploy
pipeline (`.github/workflows/deploy.yml`), and Playwright issue tags on every `e2e/` spec
landed.
Keep this current as the project moves; a stale CLAUDE.md is worse than none.

## What this project is

A small **frontend-only personal expense log**, built as a timed assessment exercise.

- Expenses have a date, amount, and category. There is a month view and per-category totals.
- The user sets a **monthly limit**; the app shows the remaining budget and warns once it is
  exceeded.
- **Mock data only.** No backend, no database, no login, no roles — single user.
- UI polish is explicitly *not* graded. The setup, the workflow, and the artifacts are.

## Project knowledge lives in `doc/`

Read these before planning work. They are the source of truth; this file only holds
instructions.

| File | What it is |
|---|---|
| `doc/requirement.md` | The original brief. Deliberately incomplete — details are ours to decide. |
| `doc/superpowers/specs/2026-08-18-expense-log-design.md` | The approved design. Architecture, data model, error handling, testing, GDPR notes. |
| `doc/backlog.md` | 5 epics, 25 user stories with acceptance criteria, and an explicit out-of-scope table. |

## Current state

Stories #11–#18 have landed: `domain/types.ts` and `domain/money.ts` (parse/format of integer
minor units), the `state/reducer.ts` `ADD_EXPENSE`/`SELECT_MONTH`/`SET_LIMIT` actions,
`ExpenseForm` + `ExpenseList` + `MonthNavigator` + `CategoryTotals` + `BudgetSummary` wired
into `App.tsx` behind `useReducer`, `domain/expenses.ts` (`expensesInMonth`, `categoryTotals`)
filtering/sorting the list and summing per-category spend for the selected month, and
`domain/month.ts` (`nextMonth`/`previousMonth`) for unbounded month navigation across year
boundaries. `state/currentMonth.ts` only supplies the initial `selectedMonth` when the reducer
is created; navigation itself is reducer state now, not a fresh clock read on every render.
State now persists to `localStorage` (epic 4, below) rather than living only in memory.

`BudgetSummary` sets an **explicit** limit for the exact viewed month via `SET_LIMIT`, but its
displayed/pre-filled value comes from `domain/limits.ts`'s `resolveLimit(limits, month)` (story
#17): the month's own explicit limit if set, else the nearest **earlier** month's, else
`undefined` — never zero, and never a *later* month's (carry-forward only goes one direction).
Editing and submitting a carried-forward value writes a new explicit entry for the viewed month
only; it does not touch the month it was inherited from. `BudgetSummary` is mounted with
`key={selectedMonth}` so it remounts (and re-syncs its input from the resolved limit) on every
month change, rather than tracking the prop with a `useEffect`.

`BudgetSummary`'s remaining-budget figure (story #18, `data-testid="remaining"`) is
`resolvedLimit - monthTotal(monthExpenses)`, recomputed at render — never stored — from a new
`domain/expenses.ts` `monthTotal()` helper (also now used by `CategoryTotals`, replacing its
own inline reduce over category rows). When no limit resolves, `BudgetSummary` shows "No limit
set." instead of a remaining figure, and the `remaining` test id is absent entirely rather than
showing a placeholder — this is deliberate: a month with no limit must never warn (spec §5), so
there's nothing meaningful to render as "remaining."

The over-limit warning (story #19, closing epic 3) is a `<p role="alert" data-testid=
"over-limit-warning">` rendered only when `domain/limits.ts`'s `budgetStatus(limit, spent)`
returns `'over'` — strictly `spent > limit`, so spend exactly at the limit shows zero remaining
and no warning ("passed means over, not reached"). `budgetStatus` resolves the tri-state
`BudgetStatus` type declared back in `domain/types.ts` (#11/#12) that had gone unused until
now; `BudgetSummary` is its first consumer, alongside its own separate `limit - spent`
subtraction for the `remaining` figure — the two are independent, not the same check.

`BudgetSummary` also commits a valid value on blur, not only on explicit submit — `ADD_EXPENSE`
can auto-switch `selectedMonth` (see above), which remounts `BudgetSummary` and would otherwise
silently discard an unsubmitted edit (PR #43 review). A `lastCommitted` ref stops that from
double-firing `onSetLimit` when a button click blurs the field and then triggers its own submit.
The amount-parse/error/disabled-submit logic shared by `BudgetSummary` and `ExpenseForm` lives
in `components/useAmountInput.ts`.

Both `ExpenseList` and `CategoryTotals` render an `<ul>`, disambiguated for tests via
`aria-label` (`"Expenses"` and `"Category totals"`) — plain `getByRole('list')` is ambiguous
once both are non-empty. `CategoryTotals` also renders a month total (sum of the category
rows) under `data-testid="month-total"`, and each category row carries
`data-testid="category-total-<category>"` — both are the stable E2E hooks the design spec
calls for (spec §7). `MonthNavigator`'s month label carries `data-testid="current-month"` for
the same reason, as do the three empty-state messages: `ExpenseList`'s "No expenses this
month." (`no-expenses`), `CategoryTotals`' "No spending this month." (`no-spending`), and
`BudgetSummary`'s "No limit set." (`no-limit`) — added after e2e specs were caught asserting
on that visible copy directly, which `.claude/skills/expense-log-conventions/SKILL.md`
forbids. Shared test fixtures (the `expense()` builder) live in `src/test/fixtures.ts`.

**Vitest is wired** (`npm run test`, jsdom + React Testing Library, config in
`vitest.config.ts` / `src/test/setup.ts`). **Playwright is wired** (`npm run test:e2e`,
config in `playwright.config.ts`, specs in `e2e/`) — its `webServer` starts the Vite dev
server automatically.

Story #25 (issue #25, epic 5, "Quality and delivery") audited unit-test coverage against its
seven acceptance criteria. Three were already fully covered by tests written during #11–#19:
carry-forward (explicit/inherited/gap/none) and the exactly-at-limit boundary, both in
`src/domain/limits.test.ts`; and money parse/format round-trips in `src/domain/money.test.ts`.
One real gap was closed at the time: `src/domain/expenses.test.ts` gained "separates adjacent
months when they straddle a year boundary". The remaining three ACs — every reducer action
including `CLEAR_ALL`, clear-then-rehydrate yielding empty state rather than seed data, and
schema validation for corrupt/wrong-version input — were deferred pending epic 4, per a comment
on issue #25 and `doc/superpowers/plans/2026-08-20-unit-test-domain-and-reducer.md`. That
follow-up is now done: `CLEAR_ALL` is covered in `src/state/reducer.test.ts`, corrupt/
wrong-version input is covered in `src/domain/schema.test.ts`, and clear-then-rehydrate is
covered at both the storage level (`src/storage/localStorage.test.ts`, "returns the empty state
written by clear-all rather than reseeding") and the component level (`App.test.tsx`, "stays
empty after clearing and a fresh mount, rather than re-seeding").

**Epic 4 — persistence (issues #20, #21, #22, #24; #23 cut, see above).** `src/storage/
localStorage.ts` is the only module touching `localStorage`, under the versioned key
`expense-log:v1`. Its `load(today)` is read-only — it never writes — and returns `{ state,
wasCorrupt }`: seed data (from the new `domain/seed.ts`, story #21) when the key is absent,
the parsed contents when `domain/schema.ts`'s `parseStoredState()` accepts them, or seed data
again with `wasCorrupt: true` when the key holds unparsable JSON or fails schema validation
(story #22). `save(state)` unconditionally overwrites the key — including with an empty
envelope, never deleting it, which is what makes `CLEAR_ALL` (the reducer's fourth action,
dispatched by the new `ClearDataButton` behind a `window.confirm`) stick rather than
re-seeding on the next load. `App.tsx` calls `load()` exactly once per mount via a lazy
`useState`, feeds its `state` into `useReducer`'s lazy initializer, and persists on every
subsequent `expenses`/`limits` change via a `useEffect` — that same effect's first run, right
after mount, is what actually writes seed/recovered data back under the key the first time,
rather than `load()` doing it itself. A `StorageRecoveryNotice` (`data-testid=
"storage-recovery-notice"`, dismissible) shows only when `wasCorrupt` was true on load.
`domain/seed.ts`'s `createSeedState(today)` is pure and takes "today" as a string rather than
calling `new Date()` itself, so it stays unit-testable without faking the clock; the ten
current-month lines are hand-picked to total exactly €1,180.00 against the seeded €1,500.00
limit, with `Rent` absorbing the remainder rather than the total being back-computed from
round-per-line figures.

Besides the harness smoke test, `e2e/add-expense.spec.ts` (#26), `e2e/budget-limit-boundary.spec.ts`
(#27), `e2e/month-navigation.spec.ts` (#14), and now `e2e/persistence.spec.ts` (#20/#24) are
written. Now that epic 4 has landed, all seed `localStorage` via `addInitScript` before page
load, per the backlog's original wording — `e2e/helpers.ts`'s `seedEmptyStorage()` writes an
empty envelope so tests get a deterministic blank slate instead of story #21's real seed data.
It only writes when the key is still absent: `addInitScript` re-runs on every navigation in a
page, including a test's own `page.reload()`, so writing unconditionally would silently wipe
out whatever the app had just persisted the moment a persistence test reloaded. `page.clock.
setFixedTime()` still pins "today" so tests stay independent of the real date. `e2e/helpers.ts`
also holds the shared `addExpense`/`setMonthlyLimit` steps. Note `getByLabel('Category')` is
ambiguous once `CategoryTotals`' `aria-label="Category totals"` list has rows — the helper uses
`getByRole('combobox', { name: 'Category' })` instead, and so does `smoke.spec.ts` now that a
genuinely-unseeded load (one that skips `seedEmptyStorage()`) shows real seed data with
non-empty category totals. `month-navigation.spec.ts` also exercises carry-forward (#17)
incidentally: navigating forward from a month with a set limit into one with none shows the
limit still carried forward, not "No limit set." — that's expected, not a bug in the test.

`vitest.config.ts` excludes `.claude/worktrees/**` in addition to `e2e/**`: a locked leftover
git worktree from an earlier background subagent run (already-merged story #25) was otherwise
being crawled as a second, stale copy of the whole test suite.

Every `test(...)` in `e2e/` (including the two in `smoke.spec.ts`) carries a Playwright tag
naming its GitHub issue — `{ tag: '@issue-26' }` and so on — as the second argument, alongside
the existing "Backlog story X.X / issue #NN" header comment each spec file already had. The tag
is what makes the link machine-readable: it shows in `npm run test:e2e`'s console/HTML output
and is filterable via `--grep '@issue-26'`, where the header comment is prose only. Any new e2e
spec should carry both.

Work is tracked as **GitHub issues**, not Jira: issues #1–#5 are the epics, #6–#30 the
stories, linked as native sub-issues. Every story in `doc/backlog.md` carries its issue
number — keep the two in step when either changes.

## Stack and commands

React 19 + TypeScript 5.9 on Vite 7, Vitest for unit tests, Playwright for end-to-end,
`localStorage` for persistence. Chosen over Blazor WASM and ASP.NET MVC despite the `-asp` in
the repo name; the reasoning is in spec §9.

```bash
npm install      # requires Node ^20.19.0 || >=22.12.0 — Vite 7's floor, not just "Node 20"
npm run dev      # dev server on http://localhost:5173 (strictPort: fails if busy, never drifts)
npm run build    # tsc -b && vite build
npm run typecheck
npm run test     # vitest run — unit + component tests, jsdom
npm run test:e2e # playwright test — starts the dev server itself, real Chromium
```

`.github/workflows/deploy.yml` runs on every push to `main` — i.e. after a PR merge, not on
every branch push or on `pull_request` events. It runs `npm run typecheck` and `npm run
test:e2e` first; either failing blocks the deploy job entirely. Only once both pass does it
`npm run build` and publish `dist/` to GitHub Pages via `actions/deploy-pages`.

TypeScript uses project references: `tsconfig.app.json` covers `src/` with DOM libs,
`tsconfig.node.json` covers `vite.config.ts` with Node types. Config files and app code have
genuinely different environments; don't collapse them back into one tsconfig.

Strictness is above the Vite default — `noUncheckedIndexedAccess` and
`exactOptionalPropertyTypes` are on, because `Limits` is a `Record<MonthKey, number>` indexed
by month key and a missing month must not silently read as `undefined`.

## Domain rules that are easy to get wrong

These are settled decisions, not preferences. Changing one means updating the spec, the
backlog, and the affected issue.

- **Money is integer minor units (cents), never floats.** Conversion happens once, in
  `money.ts`, at the form boundary. Floats produce `0.30000000000000004` in a totals column.
- **Dates are `YYYY-MM-DD` strings; the month key is `date.slice(0, 7)`.** Never group by
  `new Date(...)` — it puts an expense logged on the 1st into the previous month west of UTC.
- **Carry-forward:** a month's limit is its own explicit limit, else the nearest *earlier*
  month's, else none at all. An unset month shows "no limit set" and never warns. It must
  never default to zero.
- **"Passed" means over, not reached.** Spend exactly equal to the limit shows remaining zero
  and **no** warning. One minor unit above triggers it.
- **Clear-all writes an empty state under the retained storage key — it does not delete the
  key.** Deleting it would return the app to first-run state and re-seed the very data the
  user erased. This was a real bug caught in review; don't reintroduce it.
- **Nothing derived is ever stored.** Totals and remaining budget are computed at render.

## Architecture

Three layers, dependencies pointing inward only:

- `src/domain/` — pure TypeScript. Imports nothing from React, storage, or the browser. This
  is what makes the budget rule testable by calling a function.
- `src/storage/` — the **only** code touching `localStorage`. Keeping this a single door is
  what lets the ADR state precisely where personal data is written.
- `src/state/` + `src/components/` — reducer, context, and UI on top.

## Workflow

- **`main` is protected. Nothing goes straight to it.** Branch, PR, AI review, then merge.
  Direct pushes are rejected — this is enforced, not a convention.
- Get PRs reviewed with `/code-review --comment` so findings land as inline comments. A
  summary in chat leaves no evidence.
- The repo is public with outside contributions disabled via a `collaborators_only`
  interaction limit (expires 2027-02-18). Forking cannot be disabled on a personal public
  repo — that limit is the mechanism.
- Decisions get written down. The brief's details are ours to choose, and both the choice and
  the rejected alternative belong in the ADR.

## What Claude should never do here

- Add a backend, database, API layer, authentication, or user roles. Persistence beyond
  `localStorage` is out of scope by design, and the no-backend constraint is the basis of the
  project's GDPR position.
- Commit directly to `main`, or re-enable outside contributions.
- Re-run `scripts/seed-github-issues.sh`. It is **not** idempotent — it would duplicate all 30
  issues and overwrite the labels. It is committed as a record of how the board was made.
- Widen scope into edit, per-row delete, category filtering, user-defined categories,
  multi-currency, or per-category limits. Each was rejected on purpose; see `doc/backlog.md`.
- Invent progress. If a test fails or a step was skipped, say so rather than reporting it done.
