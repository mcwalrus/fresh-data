// Self-test for scripts/check-rule-copies.js. Creates a temp copy of the
// repository, mutates a wrapper, runs the check, and asserts that drift is
// caught. Uses the production script — not a re-implementation — so the test
// stays in sync with the check.

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const scriptPath = join(repoRoot, "scripts", "check-rule-copies.js");

async function runCheckInCopy({ mutate }) {
  const dir = mkdtempSync(join(tmpdir(), "fresh-data-check-"));
  try {
    // Copy the files the check script reads into a temp dir.
    const filesToCopy = [
      "RULES.md",
      "SKILL.md",
      "skills/fresh-data/SKILL.md",
      "commands/fresh-data.toml",
      ".cursor/rules/fresh-data.mdc",
      ".windsurf/rules/fresh-data.md",
      ".clinerules/fresh-data.md",
      ".qoder/rules/fresh-data.md",
      ".agents/rules/fresh-data.md",
      ".kiro/steering/fresh-data.md",
      ".opencode/command/fresh-data.md",
      ".openclaw/skills/fresh-data/SKILL.md",
      "pi-extension/index.js",
    ];
    for (const rel of filesToCopy) {
      const src = join(repoRoot, rel);
      const dest = join(dir, rel);
      try {
        const { mkdirSync } = await import("node:fs");
        mkdirSync(dirname(dest), { recursive: true });
        const contents = readFileSync(src, "utf8");
        writeFileSync(dest, contents);
      } catch (err) {
        if (err.code !== "ENOENT") throw err;
      }
    }

    if (mutate) mutate(dir);

    // Re-run the check script against the copy. The script computes its
    // working directory from its own location, so we copy the script into the
    // temp tree and run it from there.
    const copiedScript = join(dir, "scripts", "check-rule-copies.js");
    const { mkdirSync } = await import("node:fs");
    mkdirSync(dirname(copiedScript), { recursive: true });
    const scriptSource = readFileSync(scriptPath, "utf8");
    // Adjust the script's __dirname assumption: it derives root from
    // `dirname(fileURLToPath(import.meta.url))`, so as long as we put the
    // script at <temp>/scripts/check-rule-copies.js, its root is <temp>.
    writeFileSync(copiedScript, scriptSource);

    const { spawn } = await import("node:child_process");
    return await new Promise((resolveRun) => {
      const child = spawn(process.execPath, [copiedScript], { cwd: dir });
      let stderr = "";
      child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
      child.on("close", (code) => resolveRun({ code, stderr }));
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("check-rule-copies passes against an unmodified copy of the repo", async () => {
  const result = await runCheckInCopy({ mutate: null });
  assert.equal(result.code, 0, `stderr:\n${result.stderr}`);
});

test("check-rule-copies catches a drifted wrapper", async () => {
  const result = await runCheckInCopy({
    mutate(dir) {
      const target = join(dir, ".windsurf", "rules", "fresh-data.md");
      writeFileSync(target, "# Tampered\n\nDifferent rules.\n");
    },
  });
  assert.notEqual(result.code, 0, "drift must produce a non-zero exit code");
  assert.match(result.stderr, /\.windsurf\/rules\/fresh-data\.md drifted/);
});

test("check-rule-copies catches a removed rule from RULES.md", async () => {
  const result = await runCheckInCopy({
    mutate(dir) {
      const target = join(dir, "RULES.md");
      const current = readFileSync(target, "utf8");
      const tampered = current.replace("Always fetch before citing:", "Always look up:");
      writeFileSync(target, tampered);
    },
  });
  assert.notEqual(result.code, 0, "invariant drop must produce a non-zero exit code");
  assert.match(result.stderr, /Always fetch before citing/);
});