---
name: expense-log-conventions
description: Use when writing, reviewing, or running Playwright tests in this repo — covers required selector strategy (data-testid/role, never visible text) and required execution path (npm run test:e2e only, never a manual or visible browser) for verifying test results.
---

# Expense Log Testing Conventions

## Overview

Project-specific Playwright rules for this repo. Both exist to stop a specific
failure mode: a test (or a "let me just check this manually" verification
step) reading a stale or corrupted signal because it wasn't isolated from
other activity on the app.

## Rule 1 — Assert on `data-testid` / `role`, never visible text

- CLAUDE.md's "Current state" section is the source of truth for which
  `data-testid`s and `aria-label`s already exist (`remaining`,
  `over-limit-warning`, `month-total`, `category-total-<category>`, the
  `"Expenses"` / `"Category totals"` list labels, etc.) — check there before
  adding a new hook, and add any new one to CLAUDE.md in the same PR.
- Visible copy (button text, formatted numbers, messages like "No limit
  set.") changes for reasons unrelated to correctness — wording tweaks,
  formatting changes — and breaks tests that were never testing the wrong
  thing.
- Form field labels are the exception: `getByLabel(...)` and
  `getByRole('combobox', { name: 'Category' })` are the accessible contract,
  not display copy, and are already the pattern used in `e2e/helpers.ts`.

```ts
// Bad — breaks the moment the copy changes, tests wording not behavior
await expect(page.getByText('Remaining: 457.50')).toBeVisible()

// Good — survives copy changes, tests the actual figure
await expect(page.getByTestId('remaining')).toHaveText('Remaining: 457.50')
```

## Rule 2 — Every test runs through `npm run test:e2e`, never a manual browser

- `playwright.config.ts` is the only sanctioned entry point: its `webServer`
  starts the dev server itself (strict port 5173) and Playwright runs each
  test file against its own isolated browser context.
- **Never** drive a manual or visible browser — Playwright MCP browser
  tools, `claude-in-chrome`, or a hand-opened tab — to *verify a test
  result*, and never treat a screenshot from one as evidence a behavior
  works. The app has no backend, and its only state boundary is
  `localStorage` in the browser tab; a manual browser can share or collide
  with another live session on the same dev server (human or agent) with
  zero isolation, silently corrupting whatever you're trying to observe —
  now doubly so since epic 4 landed real persistence, so a stray manual
  session can leave behind saved state a later automated run then inherits.
- Manually driving a browser (e.g. via the `run` skill) is fine for
  one-off exploratory checks ("does this look right") — it is never a
  substitute for, or verification of, an automated test assertion.

## Red flags — stop and reach for `npm run test:e2e` instead

- About to write `page.getByText(...)` for anything other than confirming a
  label is wired to its input.
- Thinking "I'll just click through it manually to confirm the fix works."
- About to cite a screenshot or accessibility snapshot from a manual
  session as proof a test passes.
- A skill (like `run`) suggests launching a visible/headed browser against
  this project's dev server — that's for exploring the UI, not for
  confirming a test suite's result.
