#!/usr/bin/env node
// Sync each harness-specific wrapper file's body with RULES.md (the canonical
// source). Each wrapper's frontmatter (or description line for the .toml
// command file) is preserved; the rules body is replaced with RULES.md.
//
// Run after editing RULES.md to push the change to every wrapper:
//
//   node scripts/sync-rule-copies.js
//   node scripts/check-rule-copies.js

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

function read(relPath) {
  return readFileSync(join(root, relPath), "utf8").replace(/\r\n/g, "\n");
}

function write(relPath, content) {
  writeFileSync(join(root, relPath), content);
}

const canonical = read("RULES.md").trim();

// Each wrapper preserves its own frontmatter / description prefix.
// extractFrontmatter returns the prefix string (with trailing newline) so
// the body can be replaced with RULES.md content.
const wrappers = [
	["SKILL.md", text => text.match(/^---\n[\s\S]*?\n---\n*/)?.[0] ?? ""],
	["skills/fresh-data/SKILL.md", text => text.match(/^---\n[\s\S]*?\n---\n*/)?.[0] ?? ""],
	["commands/fresh-data.toml", text => text.match(/^description\s*=.*\n+/)?.[0] ?? ""],
	[".cursor/rules/fresh-data.mdc", text => text.match(/^---\n[\s\S]*?\n---\n*/)?.[0] ?? ""],
	[".windsurf/rules/fresh-data.md", () => ""],
	[".clinerules/fresh-data.md", () => ""],
	[".qoder/rules/fresh-data.md", () => ""],
	[".agents/rules/fresh-data.md", () => ""],
	[".kiro/steering/fresh-data.md", text => text.match(/^---\n[\s\S]*?\n---\n*/)?.[0] ?? ""],
	[".opencode/command/fresh-data.md", text => text.match(/^---\n[\s\S]*?\n---\n*/)?.[0] ?? ""],
	[".openclaw/skills/fresh-data/SKILL.md", text => text.match(/^---\n[\s\S]*?\n---\n*/)?.[0] ?? ""],
];

for (const [relPath, extractFrontmatter] of wrappers) {
	const current = read(relPath);
	const prefix = extractFrontmatter(current);
	write(relPath, prefix + canonical + "\n");
	console.log(`synced ${relPath}`);
}

console.log(`\nSynced ${wrappers.length} wrapper files from RULES.md.`);
console.log(`Run \`node scripts/check-rule-copies.js\` to verify they all match.`);