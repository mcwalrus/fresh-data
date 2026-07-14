# SPEC-001 — fresh-data as a pi extension and skills.sh package

## Problem Statement

The fresh-data skill lives as a single `SKILL.md` at the repo root. It works as a skills.sh-style skill (the Claude Code / Cursor / Codex / etc. installer pulls a `SKILL.md` from the repo root and exposes it to the model), but it has no:

- **pi extension** — pi users (the author's primary harness) cannot install fresh-data via `pi install npm:@mcwarlus/fresh-data`, so it is invisible from the harness the author works in.
- **Command surface** — there is no `/fresh-data` toggle, no status indicator, no way to install the rules as a project default into CLAUDE.md from inside pi.
- **Reusable rules body** — the rules live only inside the SKILL.md frontmatter description; there is no canonical rules file that other harness-specific directories (`.cursor/`, `.windsurf/`, `.codex-plugin/`, etc.) can reference without copy-paste drift.
- **Cross-harness distribution** — `npx skills@latest add mcwarlus/fresh-data` works only because of the bare `SKILL.md` at root; it does not produce a clean Claude Code plugin, Codex plugin, or Cursor rule. Ponytail solves this by shipping a single canonical file plus thin harness-specific wrappers, and shipping a single npm package that bundles a pi extension plus those wrappers.

The author wants fresh-data to behave like ponytail: installable in pi as a single npm package, installable in every other harness via the same repo (through skills.sh or its own plugin marketplace), with the rules as a single source of truth that all wrappers reference.

## Solution

Restructure the repo as a pi package (`@mcwarlus/fresh-data`) modelled on the ponytail layout:

- Move the canonical rules body into a single Markdown file (the **rules source**) that all harness-specific wrappers and the pi extension reference.
- Add a `pi-extension/` that registers `/fresh-data` (toggle on/off), `/fresh-data install` (write rules into project's CLAUDE.md), and `/fresh-data status`, plus a status-bar indicator, and injects the rules into the system prompt when active via `before_agent_start`.
- Add a `package.json` with a `pi` manifest declaring the extension and skills directories so `pi install npm:@mcwarlus/fresh-data` picks the package up.
- Add thin harness-specific directories (`.claude-plugin/`, `.codex-plugin/`, `.opencode/`, `.cursor/`, `.windsurf/`, `.clinerules/`, `.qoder/`, etc.) that reference the canonical rules file rather than copying it; include a check script that fails CI if any wrapper drifts from the canonical body.
- Keep the existing top-level `SKILL.md` for skills.sh compatibility, but make it a thin reference to the canonical rules file.

The end state: the same npm package works in pi (via the extension), Claude Code (via the plugin wrapper), Cursor / Codex / Windsurf / etc. (via their respective wrappers), and skills.sh (via the top-level SKILL.md). Installing once puts the rules into whichever harness the user is in.

## User Stories

1. As a pi user, I want to install fresh-data with `pi install npm:@mcwarlus/fresh-data`, so that the fresh-data skill is registered in my pi settings.
2. As a pi user, I want to see fresh-data listed as a loaded skill after installing, so that I know the install took effect.
3. As a pi user, I want a `/fresh-data` command to toggle the rules on for the current session, so that the agent follows them without me re-typing the rules each turn.
4. As a pi user, I want a status indicator in the footer (similar to ponytail's) showing whether fresh-data is active, so that I can confirm the toggle without scrolling the transcript.
5. As a pi user, I want the active rules to be persisted across `/new` and `/resume`, so that my session state is not lost on session boundaries.
6. As a pi user, I want to type a deactivation phrase (e.g. `stop fresh-data` or `normal mode`) to turn the rules off, so that I have a non-command way to opt out.
7. As a pi user, I want `/fresh-data status` to report whether rules are active and how they were last set, so that I can debug "why is the agent ignoring the rules".
8. As a pi user, I want `/fresh-data install` to append or merge the rules into the current project's CLAUDE.md without overwriting existing content, so that I can make the rules the project default once and stop invoking the command every session.
9. As a Claude Code user, I want to install fresh-data with `npx skills@latest add mcwarlus/fresh-data`, so that I get the rules as a skill in Claude Code.
10. As a Claude Code user, I want the `.claude-plugin/plugin.json` to declare the skill and any slash commands, so that the plugin appears in the Claude Code plugin marketplace correctly.
11. As a Cursor user, I want a `.cursor/rules/fresh-data.mdc` rule that applies automatically in projects with the plugin installed, so that the agent in Cursor follows the rules without me configuring each project.
12. As a Codex / Windsurf / Cline / Qoder / etc. user, I want the harness-specific wrapper installed by the same npm/skills.sh install to load the rules automatically, so that the same behaviour carries across tools.
13. As the developer of fresh-data, I want a single canonical rules file, so that editing the rules is a one-place change and the wrappers stay in sync.
14. As the developer, I want a CI check that fails if any wrapper's body drifts from the canonical rules, so that copy-paste rot cannot sneak in.
15. As the developer, I want the pi extension to be unit-testable without spinning up pi, so that command parsing and install behaviour are verified by fast `node --test` runs.
16. As the developer, I want the package to publish to npm with the `pi-package` keyword and a `pi` manifest, so that `pi install` discovers it.
17. As the developer, I want the README to document install paths for pi, skills.sh, and direct clone, so that users can pick the right path for their harness.

## Implementation Decisions

- **Single source of truth for rules.** The rules body lives in exactly one file (the canonical rules file). Every wrapper — pi extension, `.claude-plugin/`, `.codex-plugin/`, `.cursor/rules/`, etc. — references it rather than copying it. A `scripts/check-rule-copies.js` script (modelled on ponytail's) fails CI if any wrapper's body drifts from the canonical body.
- **pi-extension lives in `pi-extension/index.ts`.** A TypeScript module exporting a default factory `(pi: ExtensionAPI) => void`. The factory:
  - Registers `/fresh-data` (toggle), `/fresh-data status`, `/fresh-data install` commands.
  - Subscribes to `session_start`, `agent_start`, `agent_end` to update a status indicator.
  - Subscribes to `before_agent_start` and appends the rules body to `event.systemPrompt` when active.
  - Subscribes to `input` and toggles off when the user types the deactivation phrase.
- **Session-persisted mode.** Like ponytail, the on/off state is persisted via `pi.appendEntry()` with a `customType` (e.g. `fresh-data-mode`) and rehydrated on `session_start`. No environment variable, no settings file — purely session-scoped state.
- **No intensity levels.** The existing SKILL.md has no notion of "lite" / "full" / "ultra". fresh-data is binary: rules either active or not. Adding intensity levels is out of scope.
- **No custom tools, no MCP server.** The rules say "use `WebSearch` or `WebFetch` against an authoritative source". The pi extension relies on the harness's existing web search and fetch tools; it does not register its own. Ponytail follows the same pattern.
- **`commands/fresh-data.toml`** declares the `/fresh-data` command for harnesses that consume `.toml` command files (Codex-style). Mirrors ponytail's `commands/ponytail.toml`.
- **`pi-extension/install.ts`** (or `install.js`) implements `/fresh-data install`: reads the project's CLAUDE.md, inserts the rules under a clearly delimited section if absent, leaves existing user content intact, returns a status string. Pure function: takes `(projectRoot, rulesBody)` and returns a result. Testable in isolation.
- **`package.json` `pi` manifest.** Declares `extensions: ["./pi-extension/index.ts"]` and `skills: ["./skills"]`. Includes the `pi-package` keyword.
- **Harness-specific directories.** Ship the minimum set ponytail ships: `.claude-plugin/`, `.codex-plugin/`, `.opencode/`, `.cursor/`, `.windsurf/`, `.clinerules/`, `.qoder/`, `.kiro/`, `.devin-plugin/`, `.openclaw/`. Each is a thin wrapper that references the canonical rules file. Where the harness accepts symlinks (Cursor `.mdc`, Windsurf `.md`), use a symlink; where it does not (Claude Code `marketplace.json`), use a build step or a generated file that is checked in.
- **Top-level `SKILL.md` retained.** skills.sh scans the repo for `SKILL.md` at the root, so it must remain. Its body is the canonical rules file body (the frontmatter description stays for skills.sh model-invocation routing).
- **Status indicator.** A footer status (similar to ponytail's) showing `● 📡 fresh-data: ACTIVE` / `○ 📡 fresh-data: OFF`. Toggles between the two based on `agent_start` / `agent_end` and the active mode.
- **Test seams.** Three pure-function units:
  1. **Command parser** — `parseFreshDataCommand(text)` returns a tagged result (`{ type: "toggle" }`, `{ type: "status" }`, `{ type: "install" }`, `{ type: "invalid", reason }`). No dependencies on pi.
  2. **Install helper** — `installFreshDataRules(projectRoot, rulesBody)` writes to a tmpdir CLAUDE.md, returns the new file contents. Testable with `node --test` and `node:fs`.
  3. **Session resolver** — `resolveSessionMode(entries, fallback)` reads persisted entries and returns the active mode. No dependencies on pi beyond the entry shape.
- **Integration surface.** The extension factory itself. Exercised manually via `pi -e ./pi-extension/index.ts` and via a thin mock-pi integration test that asserts the right events are subscribed and the right commands are registered.
- **No npm publish automation in this spec.** The user can publish via `npm publish` from the repo root once the package is ready; CI publishing is a separate concern.

## Testing Decisions

- **Test external behaviour, not implementation details.** The command parser is tested by its tagged-result contract; the install helper is tested by what shows up in the resulting CLAUDE.md; the session resolver is tested by what mode it returns for a given set of entries.
- **No test framework.** Use `node --test` (Node 20+ built-in) like ponytail's `pi-extension/test/`.
- **Test layout:**
  - `pi-extension/test/command-parser.test.js` — parser cases: empty input (toggle), `status`, `install`, garbage input (invalid), deactivation phrases.
  - `pi-extension/test/install.test.js` — fresh CLAUDE.md (creates), existing CLAUDE.md with markers (merges without overwriting user content), existing CLAUDE.md without markers (inserts), idempotency (running install twice produces the same file).
  - `pi-extension/test/session.test.js` — empty entries (returns default), entries with active marker (returns active), entries with deactivation (returns off), mixed entries (returns latest).
  - `pi-extension/test/extension.test.js` — minimal mock-pi integration: assert that the factory subscribes to the expected events and registers the expected commands with the expected descriptions.
- **Prior art.** ponytail's `pi-extension/test/` directory (test layout, `node --test` runner, no fixtures beyond what each test creates in a tmpdir). The same `parsePonytailCommand` pattern in `pi-extension/index.js` shows the parsing style.
- **CI check.** A `scripts/check-rule-copies.js` run on every CI build that fails if any harness-specific wrapper body drifts from the canonical rules file. Same pattern as ponytail's existing check.

## Out of Scope

- **Multiple intensity levels (lite/full/ultra).** The SKILL.md has no graded behaviour; binary on/off matches the spec.
- **A dedicated web-fetching tool.** Rules rely on the harness's existing `WebSearch` / `WebFetch` (and pi's `web_search` / `fetch_content` tools when installed). Adding a fresh-data-specific tool duplicates them.
- **An MCP server.** No need for one; the rules operate on whatever tools the harness already exposes.
- **Auto-activation by default.** fresh-data is opt-in (the user runs `/fresh-data` to toggle on). Auto-activating on install would surprise users who don't want every query to force a fetch.
- **Per-project rules overrides.** `/fresh-data install` writes a single fixed rules block. Customising the block per project is a future feature.
- **npm publish CI automation.** Out of scope for this spec; the developer can publish manually once the package is ready.
- **A web UI for managing the rules.** Not needed; the canonical file is a single Markdown file in the repo.

## Further Notes

- **Package name.** `@mcwarlus/fresh-data` (matches the install command in the user's AGENTS.md: `pi install npm:@mcwarlus/fresh-data`).
- **Be issue tracker.** The spec will be filed as a `fresh-data-` beads issue with this content as the description, plus the `ready-for-agent` triage label. Beads is the project issue tracker per the repo's AGENTS.md. If the triage vocabulary is not yet established (the `setup-matt-pocock-skills` skill has not been run), file the issue without the triage label and note that triage should be applied per the `to-spec` skill convention.
- **Naming collision with the existing SKILL.md.** The current repo layout has `SKILL.md` at the root and `ponytail/` as a git submodule. After the restructure, the root `SKILL.md` becomes a thin skills.sh entrypoint; the canonical rules live in a new location (e.g. `skills/fresh-data/SKILL.md` or a dedicated `RULES.md`). The choice of canonical filename is an implementation detail to settle at build time; the spec only requires "one file that is the canonical rules body".
- **Ponytail reference.** ponytail's `pi-extension/index.js`, `package.json` `pi` key, `commands/` directory, and `scripts/check-rule-copies.js` are the closest prior art. The fresh-data extension is structurally similar (command + session persistence + status indicator + `before_agent_start` injection) but much smaller — no mode levels, no skill aliases.
- **Skills.sh compatibility.** The top-level `SKILL.md` must keep its frontmatter description with the trigger phrases (`current`, `latest`, `today`, `real-time`, etc.) so skills.sh routes correctly. The body of the file becomes a reference to the canonical rules file rather than the rules themselves.
- **Why a pi extension instead of just a skill.** pi supports both skills (Markdown with frontmatter) and extensions (TypeScript modules). The existing SKILL.md becomes a skill; the pi extension adds the command surface, status indicator, session persistence, and `before_agent_start` injection that a bare skill cannot provide. The two coexist.