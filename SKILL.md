---
name: fresh-data
description: >
  Force live data sourcing — never cite facts, figures, prices, versions, or statistics
  from training data without a live lookup. Use when the task requires current information:
  benchmarks, pricing, release notes, documentation, news, availability, or any
  time-sensitive fact. Trigger phrases: "current", "latest", "today", "real-time",
  "up to date", "as of now", "what's the price", "which version", "what does X cost".
  Also handles /fresh-data install to write fresh-data rules as a project default into
  CLAUDE.md. Not for historical research where training-era data is explicitly wanted.
user-invocable: true
---

# Fresh Data

Live lookup is the only valid source for factual claims when this skill is active.

## Dispatch

| Invocation | Behaviour |
|---|---|
| `/fresh-data` (no args) | Activate for this session — apply rules below |
| `/fresh-data install` | Write fresh-data rules as a project default into CLAUDE.md — load `commands/install.md` |

## Rules

**Always fetch before citing:**
- Prices, costs, API rates
- Software versions, release dates, changelogs
- Benchmark results, model rankings, performance figures
- Documentation (APIs evolve — never rely on training-era docs)
- News, announcements, availability, company information
- Any statistic that plausibly changes month-to-month

**Fetch procedure:** use `WebSearch` or `WebFetch` against an authoritative source. State the URL and that it was retrieved today.

**If you cannot fetch:** say so explicitly. Do not silently substitute training data.

## What Does Not Need a Live Lookup

- Mathematical or logical facts
- Historical events with fixed dates
- Foundational concepts that do not evolve (e.g. what TCP/IP is)
