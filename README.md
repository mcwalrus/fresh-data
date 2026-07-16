# Fresh Data

📡 Always fetch **_fresh data_** when relevant to your agentic development. 📡

## The Problem

AI models can default to their knowledge relative to it's training data. This can be for key information related to problem solving which can draw to the wrong analysis or problems. This skill, or AI-model harness extension aims to enforce the process of fetching the most up-to-date, revelant data available when applicable.

## How it works

Before citing key facts, the agent stops at the first rung that holds:

```
1. Does this claim age?         → no: cite from training (math, history, ideas)
2. What time is it?             → `date` for knowing the "retrieved today"
3. Primary source exists?       → fetch it (vendor docs, changelogs, registries)
4. Is the URL authoritative?    → state it; unfamiliar → click through to vendor homepage
5. If passes:                   → quote with URL and retrieval timestamp
```

Otherwise, if sources aren't authoritative or can't be fetched fresh data will state this that information couldn't be found.

## When it doesn't apply

Fresh data will ignore claims where training-era data is fine:

- **Historical events with fixed dates** — e.g. "When did WWII end?"
- **Mathematical or logical facts** — pure math, formal logic, well-established identities
- **Foundational concepts that do not evolve** — e.g. what TCP/IP is, what a hash function does
- **Blog posts, opinion pieces, essays** — when you want the *idea* or *argument*, not a specific factual claim that the post hinges on
- **Discovering new opinions or perspectives** — when the recency of the *view* doesn't matter; historic articles are fine

## Key examples

* Using `debian-12` instead of `debian-13`.
* Fetching previous version of dependencies.
* Quoting an API endpoint URL that's since been deprecated or moved.
* Citing an old default version of a framework (Next.js, React, Python, Node).
* Naming a CVE or security advisory that has since been patched or superseded.
* Using a deprecated CLI flag (e.g. old `kubectl` / `docker` / `gh` syntax).

## Worked examples

**Check the latest version of an npm package:**

```bash
curl -s https://registry.npmjs.org/<pkg>/latest | jq .version
# Or use the package manager:
npm view <pkg> version
```

**Check peer / engine compatibility without guessing:**

```bash
npm view <pkg> peerDependencies engines
```

**Find the newest articles on a site:**

```bash
curl -s https://<site>/sitemap.xml | grep -E '<loc>|<lastmod>'
# Sort by <lastmod> descending. For large sites, try /sitemap_index.xml first —
# it links to per-section sitemaps via <sitemap><loc> entries.
```

**Read a feed directly:**

```bash
curl -s https://<site>/rss.xml | grep -E '<title>|<pubDate>'
```

These are the canonical primitives. See `SKILL.md` for the full procedure and the URL list for PyPI / crates.io / RubyGems / Maven / Packagist / NuGet / Go / container registries.

## Install

### Pi

```bash
pi install npm:@mcwarlus/fresh-data
# or pin to a specific git ref:
pi install git:mcwarlus/fresh-data@<ref>
```

Once published, npm is the canonical install path. Git install remains available for tag pinning.

Once installed:

- **Slash commands:**
  - `/fresh-data` — toggle the rules on/off
  - `/fresh-data on` or `/fresh-data enable` — explicitly turn the rules on
  - `/fresh-data off` or `/fresh-data disable` — explicitly turn the rules off
  - `/fresh-data status` — report current state
  - `/fresh-data install` — write the rules into `CLAUDE.md` so they apply even when the skill is off
- **Verbal toggle:** type `stop fresh-data` or `normal mode` to turn the rules off
- **Footer indicator:** `● 📡 fresh-data: ACTIVE` vs `○ 📡 fresh-data: OFF`
- **Default:** fresh sessions start **on** after install; turning it off in a session persists across `/resume` and `/new`.

### Claude Code / skills.sh

```bash
npx skills@latest add mcwarlus/fresh-data
```

### Clone-based harnesses

Clone the repo; each harness auto-loads its file from the path below:

| Harness | Path it loads |
|---------|---------------|
| Cursor | `.cursor/rules/fresh-data.mdc` |
| Codex | `.codex-plugin/plugin.json` |
| Cline | `.clinerules/fresh-data.md` |
| Qoder | `.qoder/rules/fresh-data.md` |
| Kiro | `.kiro/steering/fresh-data.md` |
| OpenClaw | `.openclaw/skills/fresh-data/SKILL.md` |
| OpenCode | `.opencode/command/fresh-data.md`

## Development

```bash
npm test                       # runs all 57 tests (~190ms)
node scripts/check-rule-copies.js
```

## Contributing

Issues and PRs at [github.com/mcwarlus/fresh-data](https://github.com/mcwarlus/fresh-data).

The rules body is canonical in [`RULES.md`](RULES.md); every harness-specific wrapper is generated from it:

```bash
node scripts/sync-rule-copies.js    # push RULES.md to every wrapper
node scripts/check-rule-copies.js   # verify they all match
```

Tests:

```bash
npm test
```

Publishing a new version:

```bash
npm version <patch|minor|major|rc>   # bumps version in package.json
npm publish                           # npm test + check-rules run via prepublishOnly
```

## License

[MIT](LICENSE). The shortest license that works.
