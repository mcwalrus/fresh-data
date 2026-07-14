import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { FRESH_DATA_MARKER_END, FRESH_DATA_MARKER_START, installFreshDataRules } from "../install.js";

const RULES_BODY = "# Fresh Data\n\nLive lookup is the only valid source.\n";

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "fresh-data-install-"));
  return Promise.resolve()
    .then(() => fn(dir))
    .finally(() => rmSync(dir, { recursive: true, force: true }));
}

test("installFreshDataRules creates CLAUDE.md when missing", () => withTempDir(async (dir) => {
  const result = await installFreshDataRules(dir, RULES_BODY);
  const claudePath = join(dir, "CLAUDE.md");
  assert.ok(existsSync(claudePath));
  const contents = readFileSync(claudePath, "utf8");
  assert.ok(contents.includes(FRESH_DATA_MARKER_START));
  assert.ok(contents.includes(FRESH_DATA_MARKER_END));
  assert.ok(contents.includes(RULES_BODY));
  assert.equal(result.status, "created");
}));

test("installFreshDataRules inserts rules into existing CLAUDE.md without markers", () => withTempDir(async (dir) => {
  const claudePath = join(dir, "CLAUDE.md");
  const existing = "# Project notes\n\nThis is the user's content.\n";
  writeFileSync(claudePath, existing);

  const result = await installFreshDataRules(dir, RULES_BODY);
  const contents = readFileSync(claudePath, "utf8");

  assert.equal(result.status, "inserted");
  assert.ok(contents.includes(existing.trim()), "user content preserved");
  assert.ok(contents.includes(FRESH_DATA_MARKER_START));
  assert.ok(contents.includes(FRESH_DATA_MARKER_END));
  assert.ok(contents.includes(RULES_BODY));
}));

test("installFreshDataRules is idempotent when markers already present", () => withTempDir(async (dir) => {
  const claudePath = join(dir, "CLAUDE.md");
  writeFileSync(claudePath, "# User content\n");

  const first = await installFreshDataRules(dir, RULES_BODY);
  const firstContents = readFileSync(claudePath, "utf8");
  const second = await installFreshDataRules(dir, RULES_BODY);
  const secondContents = readFileSync(claudePath, "utf8");

  assert.equal(first.status, "inserted");
  assert.equal(second.status, "already-installed");
  assert.equal(secondContents, firstContents, "file unchanged on second run");
}));

test("installFreshDataRules preserves user content above the rules", () => withTempDir(async (dir) => {
  const claudePath = join(dir, "CLAUDE.md");
  const userContent = "# Project Instructions\n\nThis is the user's project.\n";
  writeFileSync(claudePath, userContent);

  await installFreshDataRules(dir, RULES_BODY);
  const contents = readFileSync(claudePath, "utf8");

  const userIdx = contents.indexOf("# Project Instructions");
  const markerIdx = contents.indexOf(FRESH_DATA_MARKER_START);
  assert.ok(userIdx >= 0);
  assert.ok(markerIdx > userIdx, "rules appear after user content");
}));

test("installFreshDataRules works in nested directories", () => withTempDir(async (dir) => {
  const nested = join(dir, "packages", "app");
  mkdirSync(nested, { recursive: true });

  const result = await installFreshDataRules(nested, RULES_BODY);
  assert.equal(result.status, "created");
  assert.ok(existsSync(join(nested, "CLAUDE.md")));
}));

test("installFreshDataRules rejects missing rules body", () => withTempDir(async (dir) => {
  await assert.rejects(() => installFreshDataRules(dir, ""), /rules/i);
  await assert.rejects(() => installFreshDataRules(dir, null), /rules/i);
}));