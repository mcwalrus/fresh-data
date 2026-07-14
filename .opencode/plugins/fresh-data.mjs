// OpenCode plugin for fresh-data. Loads the RULES.md body and injects it
// into the system prompt when active. The user toggles the active state via
// /fresh-data (registered by the pi extension); when this plugin runs
// standalone in OpenCode, the rules are applied unconditionally because
// OpenCode has no pi session to persist state through.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const rules = readFileSync(join(here, "..", "..", "RULES.md"), "utf8").trim();

export const FreshDataPlugin = async ({ project, client, $, directory, worktree }) => {
  return {
    "experimental.chat.system": async ({ system }) => {
      const base = system ? `${system}\n\n` : "";
      return base + "FRESH DATA MODE ACTIVE\n\n" + rules;
    },
  };
};