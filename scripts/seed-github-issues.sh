#!/usr/bin/env bash
# Creates the epic and story issues for the expense log from doc/backlog.md.
# Idempotency: this script is NOT idempotent — running it twice creates duplicates.
set -euo pipefail

REPO="anjalishani/expense-log-asp"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

label() { gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force >/dev/null; }

# title, bodyfile, labels... -> prints "<number> <id>"
issue() {
  local title="$1"; shift
  local bodyfile="$1"; shift
  local args=()
  local l
  for l in "$@"; do args+=(-f "labels[]=$l"); done
  gh api "repos/$REPO/issues" -X POST \
    -f "title=$title" -F "body=@$bodyfile" "${args[@]}" \
    -q '.number,.id' | paste -sd' ' -
}

# epic_number, story_database_id
link() {
  gh api "repos/$REPO/issues/$1/sub_issues" -X POST -F "sub_issue_id=$2" --silent \
    || echo "  ! sub-issue link failed for epic #$1 (id $2)" >&2
}

echo "==> labels"
label "epic"            "5319e7" "A group of related user stories"
label "story"           "1d76db" "A single user story"
label "priority:must"   "b60205" "MoSCoW: Must have"
label "priority:should" "fbca04" "MoSCoW: Should have"
label "priority:could"  "0e8a16" "MoSCoW: Could have"
label "area:foundation" "c5def5" "Tooling, scaffold, docs"
label "area:expenses"   "c5def5" "Expense capture and month view"
label "area:budget"     "c5def5" "Monthly limit and warning"
label "area:persistence" "c5def5" "Storage and privacy"
label "area:quality"    "c5def5" "Tests and delivery"

epic() { # slug, title, area, body
  local slug="$1" title="$2" area="$3" body="$4"
  printf '%s\n' "$body" > "$TMP/$slug.md"
  issue "$title" "$TMP/$slug.md" "epic" "$area"
}

story() { # slug, title, priority, area, epic_number, body
  local slug="$1" title="$2" prio="$3" area="$4" epicno="$5" body="$6"
  printf '%s\n' "$body" > "$TMP/$slug.md"
  local out num id
  out="$(issue "$title" "$TMP/$slug.md" "story" "priority:$prio" "$area")"
  num="${out% *}"; id="${out#* }"
  link "$epicno" "$id"
  echo "  #$num $title"
}

echo "==> epics"
read -r E1 E1ID < <(epic e1 "Epic 1 — Project foundation" "area:foundation" \
"**Goal:** a checked-out repo becomes a running, testable app in under five minutes.

Spec: \`doc/superpowers/specs/2026-08-18-expense-log-design.md\` §3
Backlog: \`doc/backlog.md\`

Stories are linked as sub-issues.")
echo "  epic #$E1"

read -r E2 E2ID < <(epic e2 "Epic 2 — Expense capture and month view" "area:expenses" \
"**Goal:** record expenses and see them a month at a time, broken down by category.

Spec §4, §5, §7. Depends on Epic 1.

Stories are linked as sub-issues.")
echo "  epic #$E2"

read -r E3 E3ID < <(epic e3 "Epic 3 — Budget limit and warning" "area:budget" \
"**Goal:** the rule from the brief — set a limit, see what's left, get warned when it's passed.

Spec §5 (carry-forward), §7. Depends on Epic 2.

Stories are linked as sub-issues.")
echo "  epic #$E3"

read -r E4 E4ID < <(epic e4 "Epic 4 — Persistence and privacy" "area:persistence" \
"**Goal:** data survives a refresh, never crashes the app, and can be erased on demand.

Spec §6, §8, §10.

Stories are linked as sub-issues.")
echo "  epic #$E4"

read -r E5 E5ID < <(epic e5 "Epic 5 — Quality and delivery" "area:quality" \
"**Goal:** the assessed artifacts — tests, PR workflow, decision record, session log.

Spec §11 and the requirement's Thursday section.

Stories are linked as sub-issues.")
echo "  epic #$E5"

echo "==> epic 1 stories"
story s11 "Scaffold the application" must "area:foundation" "$E1" \
"**As a** developer, **I want** a React + TypeScript app running on Vite, **so that** I have a working dev server to build features against.

### Acceptance criteria
- [ ] **Given** a fresh clone, **when** I run \`npm install && npm run dev\`, **then** the app serves locally and renders without console errors
- [ ] \`npm run build\` produces a production bundle with no TypeScript errors
- [ ] Folder structure matches the spec: \`domain/\`, \`storage/\`, \`state/\`, \`components/\`

Spec §3, §4 · Epic #$E1"

story s12 "Wire up unit testing with Vitest" must "area:foundation" "$E1" \
"**As a** developer, **I want** Vitest configured, **so that** domain logic can be tested without a browser.

### Acceptance criteria
- [ ] \`npm run test\` runs the suite and reports pass/fail
- [ ] A single test file can be run in isolation
- [ ] Tests in \`domain/\` execute without any DOM environment

Spec §3, §11 · Epic #$E1"

story s13 "Wire up end-to-end testing with Playwright" must "area:foundation" "$E1" \
"**As a** developer, **I want** Playwright configured against the dev server, **so that** user journeys can be verified in a real browser.

### Acceptance criteria
- [ ] \`npx playwright test\` starts the app and runs the suite
- [ ] A single test runs via \`npx playwright test <file> -g \"<title>\"\`
- [ ] Tests can seed \`localStorage\` through \`addInitScript\` before page load

Spec §3, §11 · Epic #$E1"

story s14 "Write the README quickstart" must "area:foundation" "$E1" \
"**As a** newcomer, **I want** setup instructions that work first time, **so that** I can run the app in under five minutes.

### Acceptance criteria
- [ ] Prerequisites state Node 20+
- [ ] Install, run, build, and both test commands listed and verified accurate
- [ ] States what the app does and that data stays in the browser

Requirement: \"README that gets someone running the app in under 5 minutes\" · Epic #$E1"

story s15 "Configure Claude Code project settings" must "area:foundation" "$E1" \
"**As a** developer, **I want** a deliberate \`.claude/settings.json\`, **so that** project permissions are intentional rather than default.

### Acceptance criteria
- [ ] Project \`settings.json\` is committed; \`settings.local.json\` stays gitignored
- [ ] Common safe commands are pre-allowed to reduce prompt friction
- [ ] The user/project/local hierarchy can be explained on demand

Requirement: \"Settings — settings.json set up on purpose\" · Epic #$E1"

echo "==> epic 2 stories"
story s21 "Domain foundations: types and money helpers" must "area:expenses" "$E2" \
"**As a** developer, **I want** pure types and money helpers, **so that** amounts are exact and logic is testable in isolation.

### Acceptance criteria
- [ ] \`Expense\`, \`Category\`, \`MonthKey\`, \`BudgetStatus\` defined per spec
- [ ] Amounts held as integer minor units; parse and format round-trip correctly
- [ ] \`money.ts\` rejects unparseable input
- [ ] Nothing in \`domain/\` imports React, storage, or browser APIs

Spec §4, §5 · Epic #$E2"

story s22 "Add an expense" must "area:expenses" "$E2" \
"**As a** user, **I want** to record an expense with a date, amount, and category, **so that** my spending is captured.

### Acceptance criteria
- [ ] Form offers the five fixed categories: Groceries, Transport, Rent, Eating out, Other
- [ ] **Given** valid input, **when** I submit, **then** the expense appears in the list and the form clears
- [ ] Amount must be greater than zero; zero and negatives rejected inline
- [ ] An invalid or missing date is rejected inline
- [ ] Submit is blocked while any field is invalid

Spec §5, §7, §8 · Epic #$E2"

story s23 "View a month's expenses" must "area:expenses" "$E2" \
"**As a** user, **I want** to see the selected month's expenses newest first, **so that** I can review recent spending.

### Acceptance criteria
- [ ] Only expenses whose \`YYYY-MM\` matches the selected month are listed
- [ ] Ordering is newest first, stable for equal dates
- [ ] An empty month shows an empty state, not a blank panel
- [ ] Month membership derived by string slice, never \`Date\` parsing

Spec §5, §7 · Epic #$E2"

story s24 "Navigate between months" must "area:expenses" "$E2" \
"**As a** user, **I want** to move to the previous or next month, **so that** I can review spending over time.

### Acceptance criteria
- [ ] Previous and next controls change the selected month
- [ ] Navigation is unbounded in both directions
- [ ] List, category totals, and budget summary all follow the selected month
- [ ] Crossing a year boundary works in both directions

Spec §7 · Epic #$E2"

story s25 "See totals per category" must "area:expenses" "$E2" \
"**As a** user, **I want** per-category totals for the month, **so that** I can see where my money went.

### Acceptance criteria
- [ ] One row per category with a non-zero total; zero rows omitted
- [ ] Totals computed at render from the expense list, never stored
- [ ] The sum of category totals equals the displayed month total

Spec §7 · Epic #$E2"

echo "==> epic 3 stories"
story s31 "Set a monthly limit" must "area:budget" "$E3" \
"**As a** user, **I want** to set a spending limit for a month, **so that** I have a budget to track against.

### Acceptance criteria
- [ ] Entering a limit while viewing month M stores it against M only
- [ ] Earlier months are never rewritten
- [ ] The limit survives navigating away to another month and back
- [ ] Invalid input is rejected without clearing the existing limit

Durability across a page refresh is **not** part of this story — persistence arrives in Epic 4, deliberately later in the build order. This story is complete when the limit is correct in application state.

Spec §5 · Epic #$E3"

story s32 "Resolve the limit for an unset month (carry-forward)" must "area:budget" "$E3" \
"**As a** user, **I want** a month with no explicit limit to inherit my most recent one, **so that** I don't have to re-enter it every month.

### Acceptance criteria
- [ ] An explicit limit for the month always wins
- [ ] Otherwise the limit comes from the nearest **earlier** month that has one
- [ ] Gaps handled: a limit two or more months back still carries forward
- [ ] With no earlier limit anywhere, the month shows \"no limit set\" and never warns
- [ ] An unset month never defaults to zero

Spec §5 (carry-forward rule) · Epic #$E3"

story s33 "See remaining budget" must "area:budget" "$E3" \
"**As a** user, **I want** to see how much of my limit is left, **so that** I know where I stand.

### Acceptance criteria
- [ ] Remaining equals the resolved limit minus the month's total spend
- [ ] Updates immediately when an expense is added
- [ ] Recalculates when the selected month changes
- [ ] When no limit is resolved, a \"no limit set\" message replaces the figure

Spec §5, §7 · Epic #$E3"

story s34 "Warn when the limit is passed" must "area:budget" "$E3" \
"**As a** user, **I want** a clear warning once I exceed my limit, **so that** I notice I've overspent.

### Acceptance criteria
- [ ] **Given** spend below the limit, **then** no warning is shown
- [ ] **Given** spend exactly equal to the limit, **then** remaining reads zero and **no** warning is shown — passed means over, not reached
- [ ] **Given** spend one minor unit above the limit, **then** the warning appears
- [ ] The warning carries \`role=\"alert\"\` and a stable \`data-testid\`

This is the rule named explicitly in the requirement. Spec §7, §11 · Epic #$E3"

echo "==> epic 4 stories"
story s41 "Persist data to localStorage" must "area:persistence" "$E4" \
"**As a** user, **I want** my expenses and limits to survive a refresh, **so that** the app is usable beyond one sitting.

### Acceptance criteria
- [ ] State saves under a versioned key on every change
- [ ] State rehydrates on load
- [ ] Both expenses and monthly limits persist — this is where the durability deferred from \"Set a monthly limit\" is delivered
- [ ] \`src/storage/localStorage.ts\` is the only module touching \`localStorage\`

Spec §6 · Epic #$E4"

story s42 "Seed mock data on first run" should "area:persistence" "$E4" \
"**As a** first-time user, **I want** the app to open with example data, **so that** I can see what it does immediately.

### Acceptance criteria
- [ ] Seeding happens only when the storage key is **absent** — never merely because the stored state is empty
- [ ] Dates generated relative to today, so the current month is always populated
- [ ] Ten expenses this month across all five categories, six last month
- [ ] Explicit €1,500.00 limit on the current month; seeded spend totals €1,180.00
- [ ] Consequently last month shows \"no limit set\" and next month inherits €1,500.00
- [ ] **Given** the user has cleared their data, **when** they reload, **then** nothing is re-seeded

Spec §6 · Epic #$E4"

story s43 "Survive corrupt stored data" should "area:persistence" "$E4" \
"**As a** user, **I want** the app to recover from unreadable saved data, **so that** it never shows a blank screen.

### Acceptance criteria
- [ ] Version and shape validated on load
- [ ] Invalid data falls back to seed data instead of throwing
- [ ] A dismissible notice explains that saved data could not be read

Spec §8 · Epic #$E4"

story s44 "Work without storage" could "area:persistence" "$E4" \
"**As a** user in private browsing, **I want** the app to still work, **so that** disabled storage isn't a dead end.

### Acceptance criteria
- [ ] Storage failures fall back to an in-memory adapter
- [ ] A banner states that changes will not persist
- [ ] All features remain usable for the session

Spec §8 · Epic #$E4"

story s45 "Clear all data" must "area:persistence" "$E4" \
"**As a** user, **I want** to erase everything I've recorded, **so that** I control my own data.

### Acceptance criteria
- [ ] The action requires confirmation before proceeding
- [ ] Clearing writes an **empty state** under the existing key — \`{ version, expenses: [], limits: {} }\` — rather than deleting the key
- [ ] The app resets to empty: no expenses, no limits
- [ ] **Given** cleared data, **when** the page is reloaded, **then** the app stays empty and does **not** re-seed
- [ ] This is the concrete right-to-erasure mechanism cited in the ADR

Retaining the key is what makes erasure stick. Deleting it would return the app to its first-run state, and seeding would repopulate the very data the user asked to remove.

Spec §6, §10 · Epic #$E4"

echo "==> epic 5 stories"
story s51 "Unit-test the domain and reducer" must "area:quality" "$E5" \
"**As a** developer, **I want** fast tests over the pure layers, **so that** the budget rule is provably correct.

### Acceptance criteria
- [ ] Carry-forward covered: explicit, inherited, gap months, none at all
- [ ] The exactly-at-limit boundary is covered
- [ ] Month filtering covered across month and year boundaries
- [ ] Money parse/format round-trips
- [ ] Every reducer action covered, including \`CLEAR_ALL\`
- [ ] Clearing then rehydrating yields empty state, not seed data
- [ ] Schema validation covered for corrupt and wrong-version input

Spec §11 · Epic #$E5"

story s52 "E2E: add an expense (normal case)" must "area:quality" "$E5" \
"**As a** reviewer, **I want** a test of the normal path, **so that** the core journey is verified in a browser.

### Acceptance criteria
- [ ] Seeds \`localStorage\` via \`addInitScript\`, independent of seed data and today's date
- [ ] Adds an expense to the current month
- [ ] Asserts it appears in the list
- [ ] Asserts month total, its category total, and remaining budget each moved by exactly that amount

One of the two Playwright tests the requirement asks for. Spec §11 · Epic #$E5"

story s53 "E2E: the limit boundary (edge case)" must "area:quality" "$E5" \
"**As a** reviewer, **I want** a test of the edge case, **so that** the warning's threshold is pinned down.

### Acceptance criteria
- [ ] Starts from a seeded state just under the limit
- [ ] Adds the expense bringing spend to exactly the limit: remaining reads zero, no warning
- [ ] Adds one more minor unit: the warning appears
- [ ] The off-by-one intent is documented in the test title

One of the two Playwright tests the requirement asks for. Spec §11 · Epic #$E5"

story s54 "Ship a change through a reviewed PR" must "area:quality" "$E5" \
"**As a** team, **we want** every change to land via pull request, **so that** nothing reaches \`main\` unreviewed.

### Acceptance criteria
- [ ] \`main\` is protected; direct pushes are rejected
- [ ] At least one PR is opened and reviewed by AI
- [ ] At least one review comment is acted on, with the follow-up commit visible in the PR
- [ ] Outside contributions are disabled on the public repo

Requirement: Thursday demo, PR workflow · Epic #$E5"

story s55 "Record the decisions in an ADR" must "area:quality" "$E5" \
"**As a** reviewer, **I want** an ADR, **so that** I can see what was decided and what was rejected.

### Acceptance criteria
- [ ] Kept in \`doc/\`, separate from the instructions in \`CLAUDE.md\`
- [ ] Records each decision *and* the alternatives not taken
- [ ] Covers what personal data the app touches and what GDPR would require
- [ ] Notes what would change if a backend were introduced

Spec §9, §10 · Epic #$E5"

story s56 "Export and commit the session log" must "area:quality" "$E5" \
"**As a** reviewer, **I want** the working session exported, **so that** the process is inspectable.

### Acceptance criteria
- [ ] Exported with the AI Hub script (AI-SDLC Documents > Session-Export)
- [ ] Committed into the repo
- [ ] Lands via a PR like everything else

Requirement: Thursday demo, session log · Epic #$E5"

echo
echo "Done. Epics: #$E1 #$E2 #$E3 #$E4 #$E5"
