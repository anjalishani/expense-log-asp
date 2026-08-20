# Unit-Test the Domain and Reducer (Story #25) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close out the remaining, buildable gaps in unit coverage for `src/domain/` and `src/state/reducer.ts`, and formally record why three of issue #25's acceptance criteria are deferred rather than silently dropped.

**Architecture:** No production code changes. This is test-only work against the existing pure layers (`domain/expenses.ts`, `domain/limits.ts`, `domain/money.ts`, `domain/month.ts`, `state/reducer.ts`), which already have substantial Vitest coverage from prior stories (#11–#19). The plan adds the one test case that closes a real gap, then documents scope.

**Tech Stack:** Vitest, existing `src/test/fixtures.ts` builder. No new dependencies.

**Spec:** `doc/backlog.md` §5.1 (Issue #25) · `doc/superpowers/specs/2026-08-18-expense-log-design.md` §11

## Global Constraints

- Money is integer minor units; never introduce floats in test fixtures.
- Dates are `YYYY-MM-DD` strings; month filtering must never use `new Date(...)`.
- "Passed" means over, not reached — spend exactly at the limit is `'under'`, one minor unit above is `'over'`.
- Nothing in `domain/` may import React, storage, or browser APIs — tests must not either.
- Test files use the existing `expense()` fixture from `src/test/fixtures.ts`, not inline object literals, where one is available.

## Pre-existing coverage (verified, no action needed)

Reading `src/domain/limits.test.ts`, `expenses.test.ts`, `money.test.ts`, `month.test.ts`, and `src/state/reducer.test.ts` shows four of #25's seven ACs are **already fully satisfied**:

- **Carry-forward** (explicit / inherited / gap / none): `limits.test.ts` `describe('resolveLimit', ...)` covers all four cases plus "ignores a later month's limit entirely."
- **Exactly-at-limit boundary**: `limits.test.ts` `describe('budgetStatus', ...)` covers spend below, spend equal (`'under'`), and spend one minor unit over (`'over'`).
- **Money parse/format round-trips**: `money.test.ts` has an explicit round-trip test plus rejection cases (unparseable, zero, negative).
- **Every reducer action covered**: the reducer currently has exactly three actions (`ADD_EXPENSE`, `SELECT_MONTH`, `SET_LIMIT`), and `reducer.test.ts` covers all three, including immutability checks. `CLEAR_ALL` does not exist yet (see Deferred ACs below), so "every reducer action" is satisfied for every action that currently exists.

## Deferred ACs (out of scope for this branch — see Task 2)

Three ACs on issue #25 depend on Epic 4 (persistence, issues #20–#24), which per `CLAUDE.md`'s "Current state" section has not been built — `src/storage/` is empty, there is no `CLEAR_ALL` reducer action, no seed data, and no schema validation:

- "Every reducer action covered, including `CLEAR_ALL`" (the `CLEAR_ALL` part)
- "Clearing then rehydrating yields empty state, not seed data"
- "Schema validation covered for corrupt and wrong-version input"

Per user decision, these are deferred rather than built as stubs here — this branch stays scoped to testing the domain/reducer layers that exist. Task 2 records this decision on the GitHub issue so it isn't silently lost.

## The one real gap: month filtering across a year boundary

`domain/expenses.test.ts`'s `expensesInMonth` suite tests that a same month-day expense in a *different* year is excluded (`2025-08-15` vs `2026-08-15` while filtering `'2026-08'`), and `domain/month.test.ts` tests `nextMonth`/`previousMonth` rolling over December↔January. Neither tests `expensesInMonth` itself with two *adjacent* months that straddle a year boundary (e.g. a Dec 31 expense and a Jan 1 expense, filtered against each of the two months). That's the literal reading of "month filtering covered across ... year boundaries" for the filtering function itself. Task 1 closes it.

---

### Task 1: Cover `expensesInMonth` across a year boundary

**Files:**
- Modify: `src/domain/expenses.test.ts` (add one test inside the existing `describe('expensesInMonth', ...)` block, after the "does not leak an expense from the same day-of-month in a different year" test)

**Interfaces:**
- Consumes: `expensesInMonth(expenses: Expense[], month: MonthKey): Expense[]` from `src/domain/expenses.ts` (unchanged); `expense()` fixture from `src/test/fixtures.ts`

- [ ] **Step 1: Write the failing-if-broken test**

```ts
  it('separates adjacent months when they straddle a year boundary', () => {
    const decemberExpense = expense({ id: '1', date: '2025-12-31' })
    const januaryExpense = expense({ id: '2', date: '2026-01-01' })

    expect(expensesInMonth([decemberExpense, januaryExpense], '2025-12')).toEqual([
      decemberExpense,
    ])
    expect(expensesInMonth([decemberExpense, januaryExpense], '2026-01')).toEqual([
      januaryExpense,
    ])
  })
```

- [ ] **Step 2: Run the test in isolation**

Run: `npm run test -- expenses.test.ts -t "straddle a year boundary"`
Expected: PASS (the implementation already slices `date.slice(0, 7)`, so this documents and locks in correct behavior rather than fixing a bug — confirm it passes, don't skip this step assuming it will)

- [ ] **Step 3: Run the full unit suite**

Run: `npm run test`
Expected: all suites pass, no regressions

- [ ] **Step 4: Commit**

```bash
git add src/domain/expenses.test.ts
git commit -m "test: cover expensesInMonth across a year boundary"
```

---

### Task 2: Record the deferred ACs on the GitHub issue

**Files:** none (GitHub only)

- [ ] **Step 1: Post a comment on issue #25** explaining the deferral, referencing this plan and the blocking issues:

Run:
```bash
gh issue comment 25 --body "Reviewed against the current codebase before implementing. Four of the seven ACs (carry-forward, exactly-at-limit boundary, money round-trips, every *existing* reducer action) were already fully covered by prior stories' tests (#11-#19) — see doc/superpowers/plans/2026-08-20-unit-test-domain-and-reducer.md for the file-by-file breakdown. Added one gap: an explicit expensesInMonth test for adjacent months straddling a year boundary.

Three ACs are deferred to Epic 4, since this branch's scope is domain/reducer tests only and those features don't exist yet:
- CLEAR_ALL reducer coverage — no CLEAR_ALL action exists (blocked on #24)
- Clear-then-rehydrate yielding empty state, not seed data — blocked on #20, #21, #24
- Schema validation for corrupt/wrong-version input — blocked on #22

Will re-open/follow up once #20-24 land."
```

Expected: comment appears on https://github.com/<org>/<repo>/issues/25 (confirm the exact `owner/repo` via `gh repo view --json nameWithOwner` before running if unsure)

- [ ] **Step 2: No commit** — this step is GitHub-only, nothing to stage

---

### Task 3: Update CLAUDE.md's "Current state" section

**Files:**
- Modify: `CLAUDE.md` (the "Current state" paragraph and the "Last updated" line at the top)

**Interfaces:** none — documentation only

- [ ] **Step 1: Add a sentence to "Current state"** noting story #25 landed, summarizing what was verified vs. added vs. deferred, in the file's existing prose style (see how #17–#19 are narrated for tone/length).

- [ ] **Step 2: Update the "Last updated" line** at the top of `CLAUDE.md` to mention story #25 alongside the existing list, per the file's own instruction ("Keep this current as the project moves").

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: note story #25 unit-test coverage and deferred ACs in CLAUDE.md"
```

---

### Task 4: Open the PR for review

**Files:** none (GitHub only)

- [ ] **Step 1: Push the branch**

```bash
git push -u origin feat/25-uni-test-domain-and-reducer
```

- [ ] **Step 2: Open the PR**

```bash
gh pr create --title "Unit-test the domain and reducer (#25)" --body "$(cat <<'EOF'
## Summary
- Verified four of #25's seven ACs were already covered by prior stories' tests (carry-forward, exactly-at-limit boundary, money round-trips, all three existing reducer actions)
- Added one gap: expensesInMonth test for adjacent months straddling a year boundary
- Deferred three ACs (CLEAR_ALL, clear-then-rehydrate, schema validation) to Epic 4, which hasn't landed yet — see comment on #25 for detail

## Test plan
- [x] `npm run test` passes locally
- [x] New test verified to pass in isolation (not just as part of the full suite)

Closes #25

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR opens against `main`; run `/code-review --comment` on it per the repo's workflow rule before merging

- [ ] **Step 3: No local commit** — this step only opens the PR

---

## Self-Review

**Spec coverage:** All seven ACs from issue #25 are addressed — four confirmed already-covered-by-existing-tests, one new test added (Task 1), three explicitly deferred with a documented reason and linked blocking issues (Task 2). No AC is silently ignored.

**Placeholder scan:** No TBD/TODO markers; the one code block (Task 1) is complete, real test code using the actual `expense()` fixture signature (`Partial<Expense>` overrides) and the actual `expensesInMonth(expenses, month)` signature, both confirmed by reading the source files.

**Type consistency:** `expense()` fixture takes `Partial<Expense>` and returns `Expense` (confirmed in `src/test/fixtures.ts`); `expensesInMonth` takes `(Expense[], MonthKey)` and returns `Expense[]` (confirmed in `src/domain/expenses.ts`) — the new test in Task 1 matches both exactly.
