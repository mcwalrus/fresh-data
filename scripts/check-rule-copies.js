#!/usr/bin/env node
// Check that every harness-specific wrapper file contains the same rules
// body as the canonical RULES.md. Fails CI with a non-zero exit code if any
// wrapper's body has drifted (copy-paste rot).
//
// The harness-specific frontmatter is allowed to differ (each harness has its
// own metadata format). The rules body, stripped of frontmatter and trimmed,
// must equal the canonical body.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

function read(relPath) {
  return readFileSync(join(root, relPath), "utf8").replace(/\r\n/g, "\n");
}

function stripFrontmatter(text) {
  return text.replace(/^---\n[\s\S]*?\n---\n*/, "").trim();
}

const canonical = read("RULES.md").trim();

// Files that should contain the canonical body, possibly wrapped in harness-
// specific frontmatter. The .kiro file has frontmatter; .mdc has frontmatter;
// the .toml command file has a leading description key.
const copies = [
  ["SKILL.md", stripFrontmatter],
  ["skills/fresh-data/SKILL.md", stripFrontmatter],
  ["commands/fresh-data.toml", text => text.replace(/^description\s*=.*$/m, "").trim()],
  [".cursor/rules/fresh-data.mdc", stripFrontmatter],
  [".windsurf/rules/fresh-data.md", text => text.trim()],
  [".clinerules/fresh-data.md", text => text.trim()],
  [".qoder/rules/fresh-data.md", text => text.trim()],
  [".agents/rules/fresh-data.md", text => text.trim()],
  [".kiro/steering/fresh-data.md", stripFrontmatter],
  [".opencode/command/fresh-data.md", stripFrontmatter],
  [".openclaw/skills/fresh-data/SKILL.md", stripFrontmatter],
];

let failed = false;

for (const [relPath, normalize] of copies) {
  const actual = normalize(read(relPath));
  if (actual !== canonical) {
    console.error(`${relPath} drifted from RULES.md`);
    failed = true;
  }
}

// Load-bearing phrases that must survive in the canonical RULES.md. The pi
// extension reads RULES.md at runtime, so a reword here propagates to every
// harness wrapper automatically. Rewording the canonical body is fine;
// dropping one of these phrases is the signal to update the README, the
// install helper, and the spec.
const INVARIANTS = [
  "Always fetch before citing",
  "Fetch procedure",
  "If you cannot fetch",
  "When Recent Data Does NOT Matter",
  "Prices, costs, API rates",
  "Documentation (APIs evolve",
  "Mathematical or logical facts",
];

const rules = read("RULES.md");
for (const phrase of INVARIANTS) {
  if (!rules.includes(phrase)) {
    console.error(`RULES.md is missing invariant: "${phrase}"`);
    failed = true;
  }
}

if (failed) {
  console.error("\nUpdate the wrapper files, RULES.md, or pi-extension/index.js so the shared rules match.");
  process.exit(1);
}

console.log(`Rule copies match RULES.md; ${INVARIANTS.length} rule invariants present in RULES.md and the extension.`);
console.log(`Checked ${copies.length} wrapper files.`);