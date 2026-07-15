---
name: fresh-data
description: >
  Force live data sourcing — never cite facts, figures, prices, versions, or statistics
  from training data without a live lookup. Use when the task requires current information:
  benchmarks, pricing, release notes, documentation, news, availability, or any
  time-sensitive fact. Trigger phrases: "current", "latest", "today", "real-time",
  "up to date", "as of now", "what's the price", "which version", "what does X cost".
  Not for historical research where training-era data is explicitly wanted.
---

# Fresh Data

Live lookup is the only valid source for factual claims when this skill is active.

## Rules

**Always fetch before citing:**
- Prices, costs, API rates
- Software versions, release dates, changelogs
- Benchmark results, model rankings, performance figures
- Documentation (APIs evolve — never rely on training-era docs)
- News, announcements, availability, company information
- Any statistic that plausibly changes month-to-month

**Fetch procedure:** perform a live web lookup against an authoritative source. State the URL and that it was retrieved today.

**If you cannot fetch:** say so explicitly. Do not silently substitute training data.

## How it works

Before citing a fact, the agent stops at the first rung that holds:

1. **Does this claim age?** No → cite from training (math, history, ideas).
2. **What time is it?** `date` (or harness date) — you need this before claiming "retrieved today".
3. **Primary source exists?** Fetch it (vendor docs, changelogs, registries).
4. **URL is authoritative?** State it; unfamiliar → click through to vendor homepage.
5. **Only then:** quote with URL + retrieval timestamp.

The sections below are the reference material for each rung.

## When Recent Data Does NOT Matter

Live lookup is overkill for claims where training-era data is fine:

- **Historical events with fixed dates** — e.g. "When did WWII end?"
- **Blog posts, opinion pieces, essays** — when the user wants the *idea* or *argument*, not a specific factual claim that the post hinges on
- **Discovering new opinions or perspectives** — when the recency of the *view* does not matter; training-era text is fine
- **Mathematical or logical facts** — pure math, formal logic, well-established identities
- **Foundational concepts that do not evolve** — e.g. what TCP/IP is, what a hash function does

The skill still applies when a blog post makes a *time-sensitive* factual claim (e.g. "the latest React version is..."). The question is whether the claim *ages*, not where it appears.

## Finding the Local Time

"Retrieved today" requires knowing what *today* is in the user's timezone. Pick one and include it in the citation:

- **POSIX (macOS / Linux):** `date +"%Y-%m-%dT%H:%M:%S%z"`
- **UTC (any POSIX):** `date -u +"%Y-%m-%dT%H:%M:%SZ"`
- **Windows PowerShell:** `Get-Date -Format "o"` or `Get-Date -AsUTC`
- **Harness context:** most agents inject today's date as context — check before shelling out

When citing a fetched URL, append the date string you got from one of the above so the user can see *when* "today" was for you.

## Authoritative Sources

When you do fetch, prefer primary sources:

- **Vendor / first-party docs** — `kubernetes.io`, `react.dev`, not a third-party tutorial site
- **Official changelogs and release notes** from the project's own repo (look for `CHANGELOG.md`, `RELEASES.md`, GitHub Releases)
- **Vendor pricing pages** — not scraped copies, not aggregator "compare" pages
- **Primary repositories** — `github.com/<owner>/<repo>` `README`s, source code, issues
- **Standards bodies and protocol authorities** — IETF, W3C, IEEE, RFC editor for protocol facts
- **Conference proceedings and academic publishers** — for peer-reviewed claims

Avoid SEO content farms, article-spinning sites, and any URL whose domain is not the source's own. If a URL looks plausible but unfamiliar, click through the vendor's homepage and find the link from there.

## Latest Dependency Versions

For "what's the latest version of X" in software engineering, hit the registry directly. Every major registry exposes a JSON endpoint:

- **npm:** `https://registry.npmjs.org/<pkg>/latest`
- **PyPI:** `https://pypi.org/pypi/<pkg>/json` — read `info.version`
- **crates.io:** `https://crates.io/api/v1/crates/<pkg>` — read `crate.max_stable_version`
- **RubyGems:** `https://rubygems.org/api/v1/versions/<pkg>.json`
- **Maven Central:** `https://search.maven.org/solrsearch/select?q=g:%22<group>%22+AND+a:%22<artifact>%22&core=gav&rows=1&wt=json`
- **Packagist (PHP):** `https://repo.packagist.org/p2/<vendor>/<pkg>.json` — read `packages.<vendor>.<pkg>[]` for `version`
- **NuGet:** `https://api.nuget.org/v3/registration5-semver1/<pkg>/index.json`
- **Go module proxy:** `https://proxy.golang.org/<module>/@latest`
- **Container registries:** `https://registry.hub.docker.com/v2/repositories/<library>/<image>/tags/` (Docker Hub) — read `results[].name`; for other registries, append `/v2/<repo>/tags/list`

Or use the package manager's own view command when one exists (`npm view <pkg> version`, `pip index versions <pkg>` on Python 3.12+, `cargo search <pkg>`, `gem search <pkg> --all`, etc.) — they all hit the same JSON under the hood.

For "what works with X" questions, read `peerDependencies`, `engines`, or `requires` from the same JSON response — do not guess.

## sitemap.xml + RSS for Recently Added Articles

When the question is "what's the newest content on this site?":

- **Try `/sitemap.xml` first.** For large sites, try `/sitemap_index.xml` which links to per-section sitemaps — follow the `<sitemap><loc>` entries to find them all.
- **Sort entries by `<lastmod>` descending** — this surfaces the most recently published or updated pages. Watch out for `<lastmod>` values that match the page template rather than the actual content; cross-check by opening the URL.
- **Also check `/feed`, `/rss.xml`, `/atom.xml`** — RSS items carry `<pubDate>` (RFC 822) which sorts cleanly. Atom uses `<updated>`.
- **Search-engine recency filter as a fallback:** `site:example.com` after:`YYYY-MM-DD` returns pages indexed after that date (works in Google, Brave, DuckDuckGo).

When citing from any of these, state the URL *and* the `<lastmod>` / `<pubDate>` value you saw — not just "today".

## Toggling On / Off

This skill is per-session and can be turned off when live-data discipline gets in the way:

- **Slash commands:**
  - `/fresh-data` — toggle the rules on/off
  - `/fresh-data on` or `/fresh-data enable` — explicitly turn the rules on (no-op if already on)
  - `/fresh-data off` or `/fresh-data disable` — explicitly turn the rules off (no-op if already off)
  - `/fresh-data status` — report the current state
  - `/fresh-data install` — write the rules into the project's `CLAUDE.md` so they apply even when the skill itself is off
- **Verbal toggles:** `stop fresh-data`, `normal mode`
- **Footer indicator:** `● 📡 fresh-data: ACTIVE` vs `○ 📡 fresh-data: OFF`
- **Default:** fresh sessions start **on** in the pi harness after install. If you turn it off in a session, that off state persists for that session and is restored on `/resume` and `/new`.

See `README.md` for the full install matrix per harness.

See `README.md` for the full install matrix per harness.
