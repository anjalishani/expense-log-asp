# AI workflow notes

How Claude Code was configured and driven on this project. This is a record of decisions, not
instructions — instructions live in [`CLAUDE.md`](../CLAUDE.md).

Covers issues #10 (settings), #34 (skills), and #35 (context management).

---

## Settings

The project settings file is [`.claude/settings.json`](../.claude/settings.json).

### The hierarchy

Claude Code merges settings from several places. Later entries override earlier ones:

| Level | Location | Committed? | What belongs here |
|---|---|---|---|
| **User** | `~/.claude/settings.json` | No — outside the repo | Personal preferences that follow you across every project: theme, model, your own always-allowed commands |
| **Project** | `.claude/settings.json` | **Yes** | Rules that should apply to everyone working on this repo. Shared, reviewable, and versioned |
| **Local** | `.claude/settings.local.json` | No — gitignored | Your personal overrides for *this* repo. Machine-specific paths, experiments, permissions you want but shouldn't impose on others |

Enterprise-managed policy settings sit above all three and can't be overridden, but none are
in play here.

The distinction that matters in practice: **project settings are a team artifact, local
settings are personal.** Anything you'd defend in code review goes in the project file;
anything that's just convenient for you goes local. `.gitignore` enforces this — it excludes
`settings.local.json` while committing `settings.json`.

### What was configured, and why

Three tiers rather than a flat allow-list, because the interesting decisions are about which
actions deserve a pause.

**Allowed outright** — read-only inspection and reversible local work: `git status`, `diff`,
`log`, `branch`, `add`, `commit`, `checkout`; `npm install`, `build`, `typecheck`, `dev`; and
the read-only `gh` subcommands. These are the commands that generated constant prompts during
the first hours of work with no decision attached to them. Nothing here reaches the network or
destroys anything.

**Ask first** — anything that leaves the machine or changes shared state: `git push`,
`gh pr create`, `gh pr merge`, `gh issue create`, and all of `gh api`. Pushing publishes to a
public repo, and merging changes `main`. A prompt on those is worth the friction. `gh api` is
in this tier rather than `allow` because it's a general-purpose escape hatch — it can do
anything the token can, including deleting things, so it doesn't get blanket approval.

**Denied** — three categories:

- *Destructive and hard to undo:* `git push --force`, `git reset --hard`, `rm -rf`,
  `gh repo delete`.
- *Project-specific:* `scripts/seed-github-issues.sh`. That script is deliberately not
  idempotent; running it again would duplicate all 30 issues and overwrite the labels. It is
  committed as a record of how the board was created, not as a tool. A deny rule is more
  reliable than a comment in the file.
- *Secrets:* reading `.env` files. There are none today, but the rule costs nothing and
  prevents a category of accident later.

The seed-script rule is the one that shows this file was written for *this* project rather
than copied from a template.

---

## Skills

The brief asks to prefer existing skills with a good reputation — Embla's own first, then
well-known public ones — and to write your own only when nothing fits.

### Used

| Skill | Where | Why |
|---|---|---|
| `superpowers:brainstorming` | Turning `doc/requirement.md` into the design spec | The brief is deliberately incomplete. This skill's architectural path forces the open questions to the surface one at a time, proposes alternatives with trade-offs, and ends in a written, approved spec. That spec then fed both the backlog and the GitHub issues. |
| `code-review` | PRs #31 and #33, with `--comment` | Posts findings as inline PR comments rather than a chat summary, which is what leaves reviewable evidence on a public repo. It found a real erasure bug in #31 and five configuration defects in #33. |
| Playwright MCP browser tools | Verifying the scaffold in #33 | Story #6 required "renders without console errors". A passing build doesn't prove that. Loading the page in a real browser caught a favicon 404 that `npm run build` was perfectly happy with. |

### Considered and not used

**Embla's own `embla-core:*` skills.** These were the first place to look, and several are
close in spirit — `embla-core:develop` for story workflow, `embla-core:jira` for backlog
creation, `embla-core:pr-review` for reviews. None were used, for one concrete reason: they
are built around **Jira for tracking and Bitbucket for pull requests**. This project tracks
work in GitHub Issues and reviews in GitHub PRs. `embla-core:jira` creates Jira work items,
`embla-core:pr-review` fetches PRs from Bitbucket, and `embla-core:deploy` transitions Jira
issues — none of which have anything to point at here.

That's a platform mismatch, not a quality judgement. On a Jira-and-Bitbucket project they
would be the right default, and the equivalent work here (epics, stories, acceptance criteria,
multi-dimension review) was done to the same shape without them.

### Written

**None.** Nothing was missing that justified a custom skill. The gap that came closest was
seeding GitHub issues from a backlog document — but that ran once, as a shell script
(`scripts/seed-github-issues.sh`), and a one-off script is the right size for a one-off job. A
skill is worth writing when a workflow will repeat and needs judgement each time; this needed
neither.

---

## Context management

### Designing before building

The design phase used `superpowers:brainstorming` rather than going straight to code. It
classified the work as **architectural** — a new project has no existing flow to modify — and
so ran the full path: clarifying questions one at a time, three approaches with trade-offs,
a design presented in sections for approval, then a written spec.

Five decisions came out of that which would otherwise have been made silently mid-implementation:
the stack, `localStorage` versus in-memory, per-month versus global limits, fixed versus
user-defined categories, and the scope cut that dropped edit, per-row delete, and filtering.
Each is recorded in the spec along with the alternative that lost.

Implementation ran without that ceremony. Once the spec existed, scaffolding was a bounded
task — the acceptance criteria were already written.

### Sessions

All work so far has happened in **one continuous session**, from reading the requirement
through to merging the scaffold. Nothing has been restarted.

**Neither `/clear` nor `/compact` has been used.** Stating that plainly rather than inventing
a reason to have used one: the context has held everything from the requirement through three
merged PRs without pressure. The natural point for a fresh session is a shift in the kind of
work — moving from documentation and setup into feature implementation for Epic 2 — where the
detailed history of settings and issue-seeding stops being useful and the spec plus CLAUDE.md
carry everything that matters. The reason that works is that the durable context lives in
files, not in the conversation.

The distinction between the two: `/compact` summarises the conversation and continues with
that summary, keeping continuity at reduced fidelity. `/clear` discards it entirely and starts
fresh. `/compact` suits a long task still in progress; `/clear` suits a clean boundary between
unrelated pieces of work.

### Subagents

`code-review` ran as a **forked background subagent** on PRs #31 and #33, twice, each time in
its own context.

That isolation is the point. The review agent read the diff and formed its own view without
the main session's context — it hadn't watched the spec being written, so it had no investment
in the decisions being correct. On #31 it caught a contradiction between two stories that had
been read past repeatedly in the main session: clear-all deleted the storage key while seeding
triggered on the key's absence, so erasing your data and reloading brought it all back. A
reviewer carrying the main session's assumptions would likely have skimmed the same two
bullets and seen nothing.

The Explore and general-purpose agents weren't needed — the repo is small enough to hold
entirely in context.
