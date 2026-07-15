# Fresh Data

![Lake Crucible, Mount Aspiring National Park](assets/DSC_1201.jpg)

*Lake Crucible, Mount Aspiring National Park — keep nature fresh.*

Force live data sourcing — never cite facts, figures, prices, versions, or statistics from training data without a live lookup.

When fresh-data is **active**, the agent follows these rules:

- **Always fetch before citing:** prices, costs, API rates, software versions, release dates, benchmarks, model rankings, documentation, news, availability, or any statistic that plausibly changes month-to-month.
- **Fetch procedure:** perform a live web lookup against an authoritative source. State the URL and that it was retrieved today.
- **If you cannot fetch:** say so explicitly. Do not silently substitute training data.

The full rules body (see `RULES.md`) covers when recent data does NOT matter, how to pick authoritative sources, how to find the local time, how to look up the latest dependency versions across registries, and how to use `sitemap.xml` + RSS to find recently published articles.

When fresh-data is **off**, the agent uses training data as normal.

## Install

- **Pi** — `pi install npm:@mcwarlus/fresh-data`. Slash commands: `/fresh-data`, `/fresh-data status`, `/fresh-data install`. Verbal toggle: type `stop fresh-data` or `normal mode` to turn the rules off. Footer shows `● 📡 fresh-data: ACTIVE` vs `○ 📡 fresh-data: OFF`.
- **Claude Code / skills.sh** — `npx skills@latest add mcwarlus/fresh-data`
- **Cursor** — clone the repo; loads `.cursor/rules/fresh-data.mdc`
- **Codex** — clone the repo; loads `.codex-plugin/plugin.json`
- **Cline** — clone the repo; loads `.clinerules/fresh-data.md`
- **Qoder** — clone the repo; loads `.qoder/rules/fresh-data.md`
- **Kiro** — clone the repo; loads `.kiro/steering/fresh-data.md`
- **OpenClaw** — clone the repo; loads `.openclaw/skills/fresh-data/SKILL.md`
- **OpenCode** — clone the repo; loads `.opencode/command/fresh-data.md`

## Development

```bash
cd pi-extension && npm test
node scripts/check-rule-copies.js
```

## License

MIT.