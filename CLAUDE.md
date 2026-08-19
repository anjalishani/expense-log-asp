# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Last updated:** 2026-08-19 — after the app scaffold landed (PR #33, story #6).
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

Stories #11 and #12 have landed: `domain/types.ts` and `domain/money.ts` (parse/format of
integer minor units), the `state/reducer.ts` `ADD_EXPENSE` action, and `ExpenseForm` +
`ExpenseList` wired into `App.tsx` behind `useReducer`. State is in-memory only — persistence
is epic 4, not built yet. `ExpenseList` has no month filtering or ordering yet; that's story
#13. `src/storage/` is still empty.

**Vitest is wired** (`npm run test`, jsdom + React Testing Library, config in
`vitest.config.ts` / `src/test/setup.ts`). **Playwright** (story #8) is not yet wired — no
end-to-end test command exists until it lands.

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
```

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
