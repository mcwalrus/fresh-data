// Session resolver: walk session entries to find the latest fresh-data-mode
// entry. Pure function — no pi dependencies beyond the entry shape.

export const FRESH_DATA_MODE_KEY = "fresh-data-mode";

export function resolveSessionMode(entries, fallback = "off") {
  if (!Array.isArray(entries)) return fallback;

  for (let i = entries.length - 1; i >= 0; i -= 1) {
    const entry = entries[i];
    if (!entry || entry.type !== "custom") continue;
    if (entry.customType !== FRESH_DATA_MODE_KEY) continue;

    const data = entry.data;
    if (!data || typeof data !== "object") continue;

    if (data.active === true) return "on";
    if (data.active === false) return "off";
  }

  return fallback;
}