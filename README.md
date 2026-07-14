# Fresh Data

Force live data sourcing — never cite facts, figures, prices, versions, or statistics from training data without a live lookup.

This package ships the same rules as a **pi extension**, a **Claude Code plugin**, a **Cursor rule**, a **Codex plugin**, a **Windsurf rule**, and a **skills.sh-installable skill**. One source of truth; every wrapper references it.

## What it does

When fresh-data is **active**, the agent follows these rules:

- **Always fetch before citing:** prices, costs, API rates, software versions, release dates, benchmarks, model rankings, documentation, news, availability, or any statistic that plausibly changes month-to-month.
- **Fetch procedure:** use `WebSearch` or `WebFetch` against an authoritative source. State the URL and that it was retrieved today.
- **If you cannot fetch:** say so explicitly. Do not silently substitute training data.

When fresh-data is **off**, the agent uses training data as normal.

## Install

### Pi (the recommended path for pi users)

```bash
pi install npm:@mcwarlus/fresh-data
```

Once installed:

- `/fresh-data` — toggle rules on/off
- `/fresh-data status` — show current state
- `/fresh-data install` — write rules into the current project's `CLAUDE.md`
- type `stop fresh-data` or `normal mode` — turn the rules off

The status indicator in the footer shows whether fresh-data is active (`● 📡 fresh-data: ACTIVE` vs `○ 📡 fresh-data: OFF`).

### Claude Code / skills.sh

```bash
npx skills@latest add mcwarlus/fresh-data
```

Or install directly as a Claude Code plugin via `.claude-plugin/plugin.json`.

### Cursor, Windsurf, Cline, Qoder, Kiro, Devin, OpenClaw

Clone the repo — each harness loads its own wrapper directory automatically:

```bash
git clone https://github.com/mcwarlus/fresh-data.git
```

| Harness | File loaded |
|---------|-------------|
| Cursor | `.cursor/rules/fresh-data.mdc` |
| Windsurf | `.windsurf/rules/fresh-data.md` |
| Cline | `.clinerules/fresh-data.md` |
| Qoder | `.qoder/rules/fresh-data.md` |
| Kiro | `.kiro/steering/fresh-data.md` |
| Codex | `.codex-plugin/plugin.json` (also installs the skill from `skills/`) |
| Claude Code | `.claude-plugin/plugin.json` (marketplace.json advertises the plugin) |
| Devin | `.devin-plugin/plugin.json` |
| OpenClaw | `.openclaw/skills/fresh-data/SKILL.md` |

## Repository layout

```
fresh-data/
├── RULES.md                       # canonical rules body (single source of truth)
├── SKILL.md                       # skills.sh entrypoint
├── skills/fresh-data/SKILL.md     # skill body used by pi / Codex
├── pi-extension/                  # pi extension (commands + session persistence + status bar)
│   ├── index.js
│   ├── command-parser.js
│   ├── install.js
│   ├── session.js
│   └── test/                      # node --test suite
├── commands/fresh-data.toml       # Codex-style command manifest
├── scripts/check-rule-copies.js   # CI check: all wrappers must match RULES.md
├── .claude-plugin/                # Claude Code plugin
├── .codex-plugin/                 # Codex plugin
├── .cursor/rules/                 # Cursor rule
├── .windsurf/rules/               # Windsurf rule
├── .clinerules/                   # Cline rule
├── .qoder/rules/                  # Qoder rule
├── .kiro/steering/                # Kiro steering
├── .agents/rules/                 # generic agents.rules
├── .devin-plugin/                 # Devin plugin
└── .openclaw/skills/fresh-data/   # OpenClaw skill
```

## Editing the rules

1. Edit **`RULES.md`** — this is the only file that should change.
2. Run `node scripts/check-rule-copies.js` to confirm every wrapper still matches.
3. Run `cd pi-extension && npm test` to confirm the extension tests still pass.

To add a new harness wrapper, create the file with the canonical `RULES.md` body (plus harness-specific frontmatter where required), then add the file path to the `copies` array in `scripts/check-rule-copies.js`.

## Development

```bash
# Run the test suite
cd pi-extension && npm test

# Check that every wrapper matches the canonical rules
node scripts/check-rule-copies.js

# Smoke-test the pi extension
pi -e ./pi-extension/index.js
```

## License

MIT.