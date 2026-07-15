The file SKILL.md was prevously a SKILL

I want to turn this into a pi extension as well as a npx skills@latest add mcwarlus/fresh-data like ponytail. Extend @SKILL.md to capture cases where not to apply the skill, refer to authorative sources, consider when recent data doesn't matter like historical events, blog articles and discovering new opinions. 

The extension should be able to turn on or off through the harnesses. The skill should also provide techniques to find what the local time is using CLI / tools, or context available. Additionally latest versions for dependencies should be refered to for the context of software engineering, with reference to sitemap.xml for websites to figure out what articles are most recently added.

The idea is that this should be visible from my harness.

## Local Development

The package ships as a pi extension, a per-harness skill set, and (eventually) an npm package. The fastest iteration loop uses pi's local-path install — it loads the package directly from the working repo on every session, so edits are live without re-tagging or re-pushing.

**Setup (one-time):**

```bash
pi install -l "$(pwd)"
```

Run from the repo root. This adds `".."` to `.pi/settings.json`. `pi list` will show the local path resolving to the repo root. Subsequent `pi` sessions load the extension, commands, and skills straight from the working tree — no cache to manage, no clone to reconcile.

**Iteration loop:**

1. Edit files in the working repo (`pi-extension/`, `SKILL.md`, `RULES.md`, wrappers under `.cursor/`, `.clinerules/`, etc.).
2. If you touched `RULES.md`, run `node scripts/sync-rule-copies.js` so the per-harness wrappers stay in sync (verified by `node scripts/check-rule-copies.js`).
3. Start a new `pi` session — changes are picked up automatically.

**Sub-second feedback on pure helpers (no pi session needed):**

```bash
cd pi-extension && npm test
```

Runs `node --test` against `command-parser.js`, `session.js`, `install.js`, and the extension harness. ~65ms for 45 tests. Use this for parser/rule/logic changes; reach for a full `pi` session only when testing the lifecycle hooks (`session_start`, `agent_start`, `before_agent_start`, `input`) or the status indicator.

**Verifying a published release:**

Switch to a tag-pinned git install to confirm the world sees what you shipped:

```bash
pi install -l git:git@github.com:mcwalrus/fresh-data@vX.Y.Z
```

The local-path and tag-pinned installs coexist cleanly in `settings.json`; remove one before adding the other if you only want a single source.

**Anti-patterns to avoid:**

- Editing files inside `.pi/git/github.com/mcwalrus/fresh-data/` directly. That cache is reconciled on `pi update` / `pi install` — edits get wiped.
- Re-tagging for every iteration. Tags are for releases; the local-path install exists precisely so dev work doesn't need them.
- Committing `.pi/settings.json` unless the change is genuinely shared (e.g. switching the pinned package source for a team).

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:6cd5cc61 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->

<!-- BEGIN BEADS CODEX SETUP: generated by bd setup codex -->
## Beads Issue Tracker

Use Beads (`bd`) for durable task tracking in repositories that include it. Use the `beads` skill at `.agents/skills/beads/SKILL.md` (project install) or `~/.agents/skills/beads/SKILL.md` (global install) for Beads workflow guidance, then use the `bd` CLI for issue operations.

### Quick Reference

```bash
bd ready                # Find available work
bd show <id>            # View issue details
bd update <id> --claim  # Claim work
bd close <id>           # Complete work
bd prime                # Refresh Beads context
```

### Rules

- Use `bd` for all task tracking; do not create markdown TODO lists.
- Run `bd prime` when Beads context is missing or stale. Codex 0.129.0+ can load Beads context automatically through native hooks; use `/hooks` to inspect or toggle them.
- Keep persistent project memory in Beads via `bd remember`; do not create ad hoc memory files.

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.
<!-- END BEADS CODEX SETUP -->
