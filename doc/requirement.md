A small frontend-only expense log: personal expenses with date, amount and category, a month view and totals per category. Mock data only, no backend, no login, no roles, single user. The app itself doesn't need to look nice — we're checking how you set up the project for AI-assisted work and how you drive Claude through the day, not the UI.

Rule: you set a monthly limit, and the app shows how much is left and warns when it's passed.

Put it in a public GitHub repo, just for this exercise.

Wednesday check-in
We'll go through your setup step by step:

Project initialized — public repo, README that gets someone running the app in under 5 minutes
CLAUDE.md — specific to this project (stack, commands, conventions, what Claude should never do here), updated as the day goes, not written once and forgotten
Skills — look for existing ones with a good reputation first (Embla's own, then well-known public ones); write your own only if nothing fits, and be ready to explain why
Settings — settings.json set up on purpose, not left default; be ready to explain the settings hierarchy (user / project / local)
Context management — be ready to show where you used plan mode vs. just letting Claude go, a fresh session vs. continuing one, /clear vs /compact, and a subagent if you used one
Information — the project knowledge you gave Claude to work from (README, ADR, any product notes), kept separate from the CLAUDE.md instructions
Planned tasks — an epic with user stories, created with Claude, not typed by hand; keep the board matching what you actually did
Data note — a few lines in your ADR on what personal data the app would touch and what GDPR would require
Show whatever app progress you have at that point — a skeleton is fine. At the end you'll get one small change request from us to add before Thursday.

Thursday demo
Run the finished app and show what you changed since Wednesday. On top of the above:

PR workflow — nothing goes straight to main; at least one PR opened and reviewed by AI, with one comment you actually acted on. The repo is public, so turn off outside contributions.
QA — two Playwright tests (one normal case, one edge case), and you should be able to explain what each one actually checks
Session log — export it with the AI Hub script (AI-SDLC Documents > Session-Export) and commit it into the repo
A few rules
The description above is incomplete on purpose — decide the details yourself, and write down your decision (and what you didn't pick) in the ADR. Please don't ask us for clarification during the day, that's part of what we're testing. Work on your own. Whatever we ask you to fix on Wednesday needs to be done and working by Thursday.