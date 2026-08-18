# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status: pre-scaffold

As of this file's creation the repo contains only `doc/requirement.md`. There is no source code, no
build system, and no git repository yet. **Update the "Stack & commands" section below the moment the
project is scaffolded** — an out-of-date CLAUDE.md is worse than none here, since keeping it current
through the day is itself part of what this project is graded on.

## What this project is

A small **frontend-only personal expense log**, built as a timed assessment exercise. The full brief is
in `doc/requirement.md` — read it before planning any work. The short version:

- Expenses have a date, amount, and category. There is a month view and per-category totals.
- The user sets a **monthly limit**; the app shows the remaining budget and warns once it is exceeded.
- **Mock data only.** No backend, no database, no login, no roles — single user.
- UI polish is explicitly *not* being graded. The setup, the workflow, and the artifacts are.

Deliverables beyond the app itself: a README that gets someone running in under 5 minutes, an ADR
(including a note on what personal data the app touches and what GDPR would require), a Jira epic with
user stories created via Claude, at least one AI-reviewed PR, two Playwright tests (one happy path, one
edge case), and an exported session log.

## Stack & commands

Not chosen yet. When the project is scaffolded, replace this section with the real install / dev /
build / lint / test commands, including **how to run a single test** (Playwright: `npx playwright test
<file> -g "<title>"`).

The directory name (`expense-log-asp`) hints at ASP.NET, but the brief says frontend-only with no
backend. Resolve that contradiction deliberately and record the decision — and the option you rejected
— in the ADR before writing code.

## Conventions

- **Decisions go in the ADR.** The brief is deliberately incomplete; every detail you decide yourself
  must be written down along with what you didn't pick. Do not ask the assessors for clarification.
- **Product knowledge lives in `doc/`**, separate from the instructions in this file. Requirements,
  ADRs, and product notes belong there — not inlined here.
- **Nothing goes straight to `main`.** Every change lands through a PR that gets an AI review, and at
  least one review comment must be acted on visibly.
- **Keep the board honest.** The Jira epic and its stories must match what was actually built.

## What Claude should never do here

- Add a backend, database, API layer, authentication, or user roles. Persistence beyond in-browser
  state is out of scope by design.
- Commit directly to `main`, or enable outside contributions on the public repo (PRs from forks stay
  off).
- Invent progress: if a test fails or a step was skipped, say so rather than reporting it as done.
- Spend effort on visual design at the expense of the workflow artifacts above.
