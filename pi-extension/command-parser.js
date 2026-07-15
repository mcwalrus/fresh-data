// Pure parsing helpers for the /fresh-data command. No pi dependencies —
// these can be unit-tested with node --test alone.

export function parseFreshDataCommand(text) {
  const normalized = String(text || "").trim().toLowerCase();
  if (!normalized) return { type: "toggle" };

  const [primary] = normalized.split(/\s+/);

  if (primary === "status") return { type: "status" };
  if (primary === "install") return { type: "install" };
  if (primary === "on" || primary === "enable") return { type: "enable" };
  if (primary === "off" || primary === "disable") return { type: "disable" };

  return { type: "invalid", reason: `unknown-command:${primary || ""}` };
}

// Detect a deactivation phrase typed into chat. Match short, deliberate
// declarations — "stop fresh-data" / "normal mode" — but not casual mentions
// like "add a normal mode toggle" where the words appear as a request.
export function isDeactivationCommand(text) {
  const normalized = String(text || "").trim().toLowerCase();
  if (!normalized) return false;

  if (normalized.includes("stop fresh-data")) return true;
  if (normalized.includes("stop fresh data")) return true;

  // "normal mode" only counts when it stands on its own (no other content
  // around it). This is the same heuristic ponytail uses for its deactivation
  // phrase so a request mentioning "normal mode" as a phrase stays active.
  return normalized === "normal mode" || normalized === "normal mode.";
}