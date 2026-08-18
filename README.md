# Expense Log

A small, frontend-only personal expense log. Record what you spend, see it a month at a time
with totals per category, set a monthly limit, and get warned when you pass it.

Everything runs in your browser. There is no backend, no database, and no account — your data
never leaves your machine.

> **Status:** scaffolded, no features yet. The app currently renders a placeholder. Features
> arrive with [epics 2–4](doc/backlog.md); progress is tracked in
> [issues](https://github.com/anjalishani/expense-log-asp/issues).

## Requirements

- **Node `^20.19.0` or `>=22.12.0`** — this is Vite 7's floor, not simply "Node 20". Node
  20.11 or 22.5 will install fine and then fail to start the dev server.
- npm 10 or newer (ships with the Node versions above)

Check yours with `node --version`.

## Run it

```bash
git clone https://github.com/anjalishani/expense-log-asp.git
cd expense-log-asp
npm install
npm run dev
```

Open **http://localhost:5173**. That's the whole setup — well under five minutes on a warm
npm cache.

If port 5173 is busy the dev server **fails rather than picking another port**. That's
deliberate (`strictPort`), so end-to-end tests can rely on a fixed address. Stop whatever is
using 5173 and try again.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Dev server with hot reload on http://localhost:5173 |
| `npm run build` | Typecheck, then build to `dist/` |
| `npm run typecheck` | Typecheck only (`tsc -b`) |
| `npm run preview` | Serve the built `dist/` locally |

There is **no test command yet.** Vitest and Playwright arrive with issues
[#7](https://github.com/anjalishani/expense-log-asp/issues/7) and
[#8](https://github.com/anjalishani/expense-log-asp/issues/8); this table gets a row each when
they land.

## How it's built

React 19 and TypeScript 5.9 on Vite 7, with `localStorage` for persistence.

The source is three layers, and the boundaries are load-bearing rather than decorative:

| Folder | Contains | Rule |
|---|---|---|
| `src/domain/` | Types, money helpers, expense selectors, budget rules | Pure TypeScript. Imports nothing from React, storage, or the browser |
| `src/storage/` | Load, save, clear, schema validation, seed data | The **only** code permitted to touch `localStorage` |
| `src/state/` | Reducer and React context | Hydrates from storage, persists on change |
| `src/components/` | UI | Presentational; derived values are computed, never stored |

Keeping `domain/` React-free is what makes the budget rule testable by calling a function
rather than rendering a component. Keeping `storage/` as the single door to `localStorage` is
what lets the privacy note in the ADR say exactly where personal data is written.

## Your data

Expenses, amounts, categories, and your monthly limit are stored in your browser's
`localStorage` and nowhere else. No network requests, no analytics, no cookies, no third
parties.

"Clear all data" erases the lot, and it does not come back on reload. See the ADR for the
full data and GDPR position.

## Project documentation

Instructions for AI assistants live in [`CLAUDE.md`](CLAUDE.md). Everything else — the
knowledge the project is built from — lives in [`doc/`](doc/):

| Document | What it is |
|---|---|
| [`doc/requirement.md`](doc/requirement.md) | The original brief |
| [`doc/superpowers/specs/2026-08-18-expense-log-design.md`](doc/superpowers/specs/2026-08-18-expense-log-design.md) | The approved design: architecture, data model, error handling, testing |
| [`doc/backlog.md`](doc/backlog.md) | Epics and user stories with acceptance criteria |

## Contributing

`main` is protected — everything lands through a pull request. Outside contributions are
disabled: this is an assessment exercise, public for review rather than for collaboration.
