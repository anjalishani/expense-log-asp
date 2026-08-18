# Expense Log — Design Spec

**Date:** 2026-08-18
**Status:** Approved, ready for implementation planning
**Source requirement:** `doc/requirement.md`

## 1. Purpose

A frontend-only personal expense log. The user records expenses (date, amount, category),
views them a month at a time with totals per category, sets a monthly spending limit, and
sees how much is left — with a warning once the limit is passed.

The app is a vehicle for demonstrating AI-assisted development workflow. UI polish is
explicitly not a goal. Structure, testability, and traceable decisions are.

## 2. Scope

**In scope**

- Add an expense: date, amount, category
- Month view: the selected month's expenses, newest first
- Totals per category for the selected month
- Navigate between months (previous / next, unbounded)
- Set a monthly limit; see remaining budget; warning when the limit is passed
- Clear all data (single action, with confirmation)

**Out of scope** — deliberately, with reasoning in §9

Editing an expense, deleting individual expenses, filtering the list by category,
user-defined categories, multi-currency, per-category limits, income or refunds,
any backend, database, authentication, or multi-user support.

## 3. Stack

| Concern | Choice |
|---|---|
| Framework | React with TypeScript |
| Build / dev server | Vite |
| Unit tests | Vitest |
| End-to-end tests | Playwright |
| Persistence | Browser `localStorage` |
| Runtime | Node 20+ |

Commands: `npm install`, `npm run dev`, `npm run build`, `npm run test` (Vitest),
`npx playwright test`. A single test: `npx playwright test <file> -g "<title>"`.

## 4. Architecture

Three layers. Dependencies point inward only — `domain/` imports nothing from React,
the browser, or storage.

```
src/
  domain/                  pure TypeScript
    types.ts                 Expense, Category, MonthKey, BudgetStatus
    money.ts                 parse / format minor units
    expenses.ts              expensesInMonth, totalsByCategory, monthTotal
    budget.ts                limitForMonth, remaining, status
  storage/                 the only code touching window.localStorage
    localStorage.ts          load / save / clear, with in-memory fallback
    schema.ts                version + shape validation
    seed.ts                  mock data, generated relative to today
  state/
    reducer.ts               pure reducer
    ExpenseContext.tsx       hydrate, dispatch, persist
  components/
    MonthNavigator.tsx  ExpenseForm.tsx  ExpenseList.tsx
    CategoryTotals.tsx  BudgetSummary.tsx  ClearDataButton.tsx
  App.tsx  main.tsx
```

Two boundaries carry the design:

- **`domain/` is React-free**, so the budget rule — the only real logic in the app — is
  verified by calling a function. No DOM, no render, no test harness.
- **`storage/` is the single door to `localStorage`**, so the privacy discussion in the ADR
  points at one file and can state precisely where personal data is written.

## 5. Data model

**Money is stored as integer minor units (cents).** Floating-point arithmetic across a
totals column produces artefacts like `0.30000000000000004`; a budget app must not display
those. Conversion happens once, at the form boundary, in `money.ts`. Single currency (EUR),
rendered with `Intl.NumberFormat`.

**Dates are `YYYY-MM-DD` strings**, and the month key is a string slice, `date.slice(0, 7)`.
Grouping never goes through `new Date(...)`, which would place an expense logged on the 1st
into the previous month for any user west of UTC.

```ts
type Category = 'Groceries' | 'Transport' | 'Rent' | 'Eating out' | 'Other'
type MonthKey = string   // 'YYYY-MM'

type Expense = {
  id: string        // crypto.randomUUID()
  date: string      // 'YYYY-MM-DD'
  amount: number    // minor units, always > 0
  category: Category
}

type Limits = Record<MonthKey, number>   // minor units
type BudgetStatus = 'no-limit' | 'under' | 'over'
```

Categories are a fixed built-in list. The requirement asks only for totals per category,
which a fixed list satisfies without a management screen, rename semantics, or
delete-with-existing-expenses edge cases.

### The carry-forward rule

The limit for month `M` is resolved in this order:

1. The limit explicitly set for `M`
2. Otherwise, the limit from the nearest **earlier** month that has one
3. Otherwise, no limit — the app shows "no limit set" and never warns

Setting a limit while viewing month `M` writes to `M` only; it never rewrites earlier months.
Rule 3 matters: defaulting an unset month to zero would make the app warn the instant it
opened on any new month.

## 6. Persistence

One versioned JSON blob under key `expense-log:v1`:

```ts
{ version: 1, expenses: Expense[], limits: Limits }
```

Seed data is written on first run only (key absent), with dates computed relative to today
so the app always opens on a populated month. The seed contains ten expenses in the current
month and six in the previous month, spread across all five categories, and sets an explicit
limit of €1,500.00 on the **current** month only. Seeded current-month spend totals
€1,180.00 exactly.

That seed is chosen to exercise both branches of the carry-forward rule on sight: the
previous month has no earlier limit to inherit and shows "no limit set", while the next month
inherits €1,500.00 from the current one. It also opens under budget, leaving headroom to push
the app over the limit live during a demo.

**"Clear all data" leaves the app empty, not re-seeded.** Re-seeding after an erasure action
reads as a broken button and would contradict the erasure claim in the ADR. The key is
removed and state resets to empty expenses and empty limits.

## 7. State and data flow

State is unidirectional. `ExpenseContext` hydrates once from `storage.load()` through lazy
reducer initialisation; one effect persists the whole blob on change. Actions:
`ADD_EXPENSE`, `SET_LIMIT`, `SELECT_MONTH`, `CLEAR_ALL`. The reducer is pure and
unit-tested directly.

**No derived value is ever stored.** `CategoryTotals` and `BudgetSummary` call `domain/`
selectors during render against the selected month. A stored total is a total that can
disagree with the list it summarises.

Components split by responsibility:

| Component | Responsibility |
|---|---|
| `MonthNavigator` | Previous / next month; dispatches `SELECT_MONTH` |
| `ExpenseForm` | Local field state and validation; dispatches on valid submit only |
| `ExpenseList` | Selected month's expenses, newest first, stable for equal dates |
| `CategoryTotals` | Per-category sums for the month; zero rows omitted |
| `BudgetSummary` | Limit input, remaining amount, over-limit warning |
| `ClearDataButton` | Confirmation, then `CLEAR_ALL` |

`BudgetSummary` is the only component that renders the limit rule, so it is the only target
the edge-case E2E test needs.

Stable hooks for tests: `data-testid` on `remaining`, `month-total`,
`category-total-<category>`, and `over-limit-warning`. The warning carries `role="alert"`.

## 8. Error handling

Every failure mode leaves the app running.

**Corrupt stored data.** `schema.ts` validates version and shape on load. On failure the app
falls back to seed data and shows a dismissible notice. A blank screen because someone
hand-edited `localStorage` is not an acceptable demo failure.

**`localStorage` unavailable** — private browsing, disabled storage, quota exceeded. The
storage module degrades to an in-memory adapter and a banner states that changes will not
persist. The app stays fully usable; it simply forgets.

**Form validation.** Amount must parse and be strictly greater than zero. Date must be a real
calendar date. Category is required. Errors render inline beside the field; submit is blocked.
Rejecting zero and negative amounts is deliberate — it keeps this an expense log rather than
a ledger with income and refunds.

## 9. Decisions and rejected alternatives

The requirement is incomplete by design; these are the calls made and what was set aside.

| Decision | Rejected | Why |
|---|---|---|
| React + TS + Vite | Blazor WASM; ASP.NET MVC/Razor; plain HTML/JS | Fastest to a running app and the smoothest Playwright integration. The directory name `expense-log-asp` suggests ASP.NET, but the requirement states frontend-only with no backend; Blazor WASM would have honoured both at the cost of a heavier toolchain and more timing-sensitive E2E tests. |
| `localStorage` | In-memory only; limit-only persistence | Survives refresh, so the demo behaves like an application, and gives the E2E tests real state to assert against. Still zero backend. |
| Per-month limits with carry-forward | One global limit; per-category limits | Matches how budgeting actually works and makes month navigation meaningful. Per-category limits were scope the requirement never asked for. |
| Fixed category list | User-defined; fixed plus free-text | Totals per category is the only stated need. User-defined categories cost a management UI and rename/delete edge cases for no assessed benefit. |
| Integer minor units | Floating-point amounts | Avoids visible float artefacts in totals. |
| `YYYY-MM-DD` strings, slice for month | `Date` objects | Avoids timezone off-by-one at month boundaries. |
| Layered domain/storage/React | Zustand with `persist`; hook-per-concern | Keeps the budget rule in pure functions that test in milliseconds, and confines personal data to one module. |
| Clear-all only | Per-row delete; full edit | Satisfies erasure with one affordance; per-row CRUD was cut as scope. |

## 10. Personal data and GDPR (ADR input)

**What the app touches.** Expense date, amount, and category, plus a monthly limit. Taken
together this is personal financial data revealing spending habits — under GDPR it is
personal data, though not a special category under Article 9.

**Where it lives.** Exclusively in the user's own browser, in `localStorage`, written only by
`src/storage/localStorage.ts`. There is no server, no database, no network transmission, no
analytics, no cookies, and no third-party processor. No data leaves the device.

**What follows.** With no controller-held data there is no transfer, no cross-border issue,
and nothing to breach server-side. Erasure is satisfied by "Clear all data", which removes
the storage key outright. Portability and access are effectively satisfied by the data being
on the user's own machine, though neither is an explicit feature.

**What would change with a backend.** Adding server persistence or accounts would introduce a
controller relationship and with it: a lawful basis (contract or consent), a privacy notice,
a defined retention period, working access/erasure/portability endpoints, encryption in
transit and at rest, breach notification within 72 hours, and a processor agreement for any
hosting provider. This is the main reason the no-backend constraint is worth keeping.

## 11. Testing

**Unit (Vitest)** — carries the logic, since `domain/` is pure and fast:

- Carry-forward across gap months, and the no-limit case
- The boundary where spend equals the limit exactly
- Month filtering across month and year boundaries
- Minor-unit parse/format round-tripping
- Every reducer transition, including `CLEAR_ALL`
- Schema validation against corrupt and wrong-version input

**End-to-end (Playwright)** — the two tests the requirement asks for. Both seed
`localStorage` via `addInitScript` before page load, making them deterministic and
independent of both the seed data and the current date.

1. **Happy path — add an expense.** Add an expense to the current month, then assert it
   appears in the list *and* that the month total, its category total, and the remaining
   budget each moved by exactly that amount. Checks that one user action propagates
   correctly through every derived view.

2. **Edge case — the limit boundary.** Starting just under the limit, add the expense that
   brings spend to *exactly* the limit: assert remaining reads zero and **no** warning is
   shown. Then add one more cent: assert the warning appears. Pins down the off-by-one in
   "warns when it's passed" — passed means over, not reached.

## 12. Suggested epic breakdown

Input for story generation, not a commitment to structure:

1. **Project foundation** — Vite + TS scaffold, Vitest and Playwright wiring, README that
   gets someone running in under five minutes, `.claude/settings.json`
2. **Expense capture and month view** — domain types and selectors, add form with validation,
   list, month navigation
3. **Budget limit and warning** — limits model, carry-forward resolution, budget summary,
   over-limit warning
4. **Persistence and privacy** — storage adapter, schema validation, seeding, degraded and
   corrupt-data handling, clear all data
5. **Quality and delivery** — unit suite, the two Playwright tests, PR with AI review, ADR,
   session log export
