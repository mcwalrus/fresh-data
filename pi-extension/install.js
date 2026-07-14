// Install helper: write fresh-data rules into a project's CLAUDE.md without
// overwriting existing user content. Idempotent. Pure function over node:fs.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const FRESH_DATA_MARKER_START = "<!-- BEGIN FRESH_DATA -->";
export const FRESH_DATA_MARKER_END = "<!-- END FRESH_DATA -->";

function buildSection(rulesBody) {
  const trimmed = String(rulesBody || "").trim();
  if (!trimmed) throw new Error("installFreshDataRules: rulesBody is required");
  return `\n${FRESH_DATA_MARKER_START}\n${trimmed}\n${FRESH_DATA_MARKER_END}\n`;
}

function hasMarkers(contents) {
  return contents.includes(FRESH_DATA_MARKER_START) && contents.includes(FRESH_DATA_MARKER_END);
}

export async function installFreshDataRules(projectRoot, rulesBody) {
  if (!rulesBody || !String(rulesBody).trim()) {
    throw new Error("installFreshDataRules: rulesBody is required");
  }

  const claudePath = join(projectRoot, "CLAUDE.md");

  if (!existsSync(claudePath)) {
    writeFileSync(claudePath, buildSection(rulesBody), "utf8");
    return { status: "created", path: claudePath };
  }

  const existing = readFileSync(claudePath, "utf8");
  if (hasMarkers(existing)) {
    return { status: "already-installed", path: claudePath };
  }

  const next = `${existing.trimEnd()}${buildSection(rulesBody)}`;
  writeFileSync(claudePath, next, "utf8");
  return { status: "inserted", path: claudePath };
}