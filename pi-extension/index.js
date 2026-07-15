// fresh-data pi extension.
//
// Wires a /fresh-data command (toggle / status / install) to the harness, and
// injects the RULES.md rules into the system prompt when active. Session
// state is persisted via pi.appendEntry so /new and /resume don't lose it.
//
// Pure helpers live in command-parser.js, install.js, session.js. This file
// is the only thing that imports pi's ExtensionAPI.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { isDeactivationCommand, parseFreshDataCommand } from "./command-parser.js";
import { installFreshDataRules } from "./install.js";
import { FRESH_DATA_MODE_KEY, resolveSessionMode } from "./session.js";

const here = dirname(fileURLToPath(import.meta.url));
const RULES_PATH = join(here, "..", "RULES.md");
export const FRESH_DATA_RULES = readFileSync(RULES_PATH, "utf8").trim();

const STATUS_KEY = "fresh-data";
const FRESH_DATA_HEADING = "FRESH DATA MODE ACTIVE";

function formatStatusText(theme, isActive) {
  if (!theme?.fg) return "";
  const indicator = isActive ? theme.fg("accent", "●") : theme.fg("dim", "○");
  const icon = theme.fg("muted", "📡");
  const label = isActive
    ? theme.fg("text", "fresh-data: ") + theme.fg("accent", "ACTIVE")
    : theme.fg("text", "fresh-data: ") + theme.fg("dim", "OFF");
  return `${indicator} ${icon} ${label}`;
}

function buildRulesBlock() {
  return `${FRESH_DATA_HEADING}\n\n${FRESH_DATA_RULES}`;
}

export default function freshDataExtension(pi) {
  let currentMode = "off";
  let isAgentActive = false;
  let lastCtx = null;

  function syncStatus(ctx) {
    const c = ctx || lastCtx;
    if (!c?.ui?.setStatus) return;
    // pi-web theme proxy can throw before initTheme completes; swallow it so
    // a half-loaded theme doesn't crash the session.
    let theme;
    try { theme = c.ui.theme; if (!theme?.fg) return; } catch { return; }
    const text = formatStatusText(theme, currentMode === "on" && isAgentActive);
    if (currentMode === "off") {
      c.ui.setStatus(STATUS_KEY, "");
      return;
    }
    c.ui.setStatus(STATUS_KEY, text);
  }

  function persistMode(active, ctx) {
    currentMode = active ? "on" : "off";
    pi.appendEntry(FRESH_DATA_MODE_KEY, { active });
    syncStatus(ctx);
  }

  function injectRules(event) {
    if (currentMode !== "on") return;
    const base = event?.systemPrompt ? `${event.systemPrompt}\n\n` : "";
    return { systemPrompt: `${base}${buildRulesBlock()}` };
  }

  pi.registerCommand("fresh-data", {
    description: "Toggle fresh-data rules. Subcommands: on, off, enable, disable, status, install.",
    handler: async (args, ctx) => {
      const parsed = parseFreshDataCommand(args);

      if (parsed.type === "status") {
        const state = currentMode === "on" ? "ACTIVE" : "OFF";
        ctx?.ui?.notify?.(`fresh-data: ${state}`, "info");
        return;
      }

      if (parsed.type === "install") {
        try {
          const result = await installFreshDataRules(ctx?.cwd || process.cwd(), FRESH_DATA_RULES);
          const message = {
            created: "Wrote fresh-data rules to CLAUDE.md.",
            inserted: "Inserted fresh-data rules into CLAUDE.md.",
            "already-installed": "CLAUDE.md already contains fresh-data rules.",
          }[result.status] || `fresh-data install: ${result.status}`;
          ctx?.ui?.notify?.(message, "info");
        } catch (err) {
          ctx?.ui?.notify?.(`fresh-data install failed: ${err.message}`, "error");
        }
        return;
      }

      if (parsed.type === "toggle") {
        const next = currentMode === "on" ? false : true;
        persistMode(next, ctx);
        ctx?.ui?.notify?.(
          next ? "fresh-data: ACTIVE (rules will be injected)" : "fresh-data: OFF",
          "info",
        );
        return;
      }

      if (parsed.type === "enable" || parsed.type === "disable") {
        const wantActive = parsed.type === "enable";
        if (wantActive && currentMode === "on") {
          ctx?.ui?.notify?.("fresh-data: already ACTIVE", "info");
          return;
        }
        if (!wantActive && currentMode === "off") {
          ctx?.ui?.notify?.("fresh-data: already OFF", "info");
          return;
        }
        persistMode(wantActive, ctx);
        ctx?.ui?.notify?.(
          wantActive ? "fresh-data: ACTIVE (rules will be injected)" : "fresh-data: OFF",
          "info",
        );
        return;
      }

      ctx?.ui?.notify?.(`fresh-data: ${parsed.reason || "unknown command"}`, "warning");
    },
  });

  pi.on("input", async (event) => {
    if (event?.source === "extension") return;
    const text = String(event?.text || "");
    if (currentMode === "on" && isDeactivationCommand(text)) {
      persistMode(false);
    }
  });

  pi.on("session_start", async (_event, ctx) => {
    lastCtx = ctx;
    const entries = ctx?.sessionManager?.getBranch?.() || ctx?.sessionManager?.getEntries?.() || [];
    currentMode = resolveSessionMode(entries, "on");
    isAgentActive = false;
    syncStatus(ctx);
  });

  pi.on("agent_start", async (_event, ctx) => {
    isAgentActive = true;
    syncStatus(ctx);
  });

  pi.on("agent_end", async (_event, ctx) => {
    isAgentActive = false;
    syncStatus(ctx);
  });

  pi.on("before_agent_start", injectRules);
}

export { isDeactivationCommand, parseFreshDataCommand, resolveSessionMode, installFreshDataRules };